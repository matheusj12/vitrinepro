-- ============================================
-- MIGRATION: Sistema de Temas v2 - Incremental
-- Adiciona funcionalidades de tema com preview/apply/revert
-- ============================================

-- 1. Adicionar colunas necessárias em themes (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'themes' AND column_name = 'tenant_id'
  ) THEN
    ALTER TABLE public.themes ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    CREATE INDEX idx_themes_tenant ON public.themes(tenant_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'themes' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.themes ADD COLUMN description TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'themes' AND column_name = 'colors'
  ) THEN
    ALTER TABLE public.themes ADD COLUMN colors JSONB DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'themes' AND column_name = 'variables'
  ) THEN
    ALTER TABLE public.themes ADD COLUMN variables JSONB DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'themes' AND column_name = 'is_premium'
  ) THEN
    ALTER TABLE public.themes ADD COLUMN is_premium BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'themes' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE public.themes ADD COLUMN thumbnail_url TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'themes' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.themes ADD COLUMN created_by UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'themes' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.themes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
  END IF;
END $$;

-- 2. Migrar config existente para colors (converter de config para colors)
UPDATE public.themes
SET colors = config->'colors'
WHERE colors = '{}' OR colors IS NULL;

-- 3. Marcar temas existentes como premium ou free baseado no type
UPDATE public.themes
SET is_premium = CASE 
  WHEN type = 'free' THEN false
  ELSE true
END
WHERE is_premium IS NULL OR is_premium = false;

-- 4. Adicionar colunas em tenants para seleção de tema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'selected_theme_id'
  ) THEN
    ALTER TABLE public.tenants 
      ADD COLUMN selected_theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL;
    CREATE INDEX idx_tenants_selected_theme ON public.tenants(selected_theme_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'theme_preview_id'
  ) THEN
    ALTER TABLE public.tenants 
      ADD COLUMN theme_preview_id UUID REFERENCES public.themes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenants' AND column_name = 'previous_theme_id'
  ) THEN
    ALTER TABLE public.tenants 
      ADD COLUMN previous_theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 5. Criar/atualizar trigger para updated_at em themes
CREATE OR REPLACE FUNCTION public.update_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_themes_updated_at_trigger ON public.themes;
CREATE TRIGGER update_themes_updated_at_trigger
  BEFORE UPDATE ON public.themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_themes_updated_at();

-- 6. Função para validar se tenant pode usar tema
CREATE OR REPLACE FUNCTION public.can_use_theme(p_tenant_id UUID, p_theme_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_theme_is_premium BOOLEAN;
  v_tenant_plan_slug TEXT;
BEGIN
  -- Buscar se tema é premium
  SELECT is_premium INTO v_theme_is_premium
  FROM public.themes
  WHERE id = p_theme_id AND active = true;

  -- Se tema não existe ou não está ativo, não pode usar
  IF v_theme_is_premium IS NULL THEN
    RETURN false;
  END IF;

  -- Se tema é free, qualquer um pode usar
  IF v_theme_is_premium = false THEN
    RETURN true;
  END IF;

  -- Se tema é premium, verificar plano do tenant
  SELECT p.slug INTO v_tenant_plan_slug
  FROM public.tenants t
  LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
  LEFT JOIN public.plans p ON p.id = s.plan_id
  WHERE t.id = p_tenant_id
  LIMIT 1;

  -- Se não tem plano ou é free, não pode usar premium
  IF v_tenant_plan_slug IS NULL OR v_tenant_plan_slug = 'free' THEN
    RETURN false;
  END IF;

  -- Essencial e Pro podem usar
  RETURN true;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 7. Função para aplicar tema com transação e auditoria
CREATE OR REPLACE FUNCTION public.apply_theme(
  p_tenant_id UUID,
  p_theme_id UUID,
  p_user_id UUID,
  p_is_preview BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
  v_previous_theme_id UUID;
  v_can_use BOOLEAN;
BEGIN
  -- Verificar se pode usar o tema
  v_can_use := public.can_use_theme(p_tenant_id, p_theme_id);
  
  IF NOT v_can_use THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Plano não permite usar este tema ou tema inativo'
    );
  END IF;

  -- Buscar tema anterior
  SELECT selected_theme_id INTO v_previous_theme_id
  FROM public.tenants
  WHERE id = p_tenant_id;

  -- Se for preview, apenas atualizar preview_id
  IF p_is_preview THEN
    UPDATE public.tenants
    SET theme_preview_id = p_theme_id
    WHERE id = p_tenant_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'preview', true,
      'theme_id', p_theme_id
    );
  END IF;

  -- Aplicar tema definitivamente
  UPDATE public.tenants
  SET 
    selected_theme_id = p_theme_id,
    previous_theme_id = v_previous_theme_id,
    theme_preview_id = NULL,
    updated_at = now()
  WHERE id = p_tenant_id;

  -- Registrar auditoria
  INSERT INTO public.admin_logs (action, user_id, tenant_id, meta)
  VALUES (
    'theme.apply',
    p_user_id,
    p_tenant_id,
    jsonb_build_object(
      'theme_before', v_previous_theme_id,
      'theme_after', p_theme_id,
      'timestamp', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'preview', false,
    'theme_id', p_theme_id,
    'previous_theme_id', v_previous_theme_id
  );
EXCEPTION
  WHEN OTHERS THEN
    -- Em caso de erro, retornar erro sem quebrar
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Função para reverter tema
CREATE OR REPLACE FUNCTION public.revert_theme(p_tenant_id UUID, p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_previous_theme_id UUID;
  v_current_theme_id UUID;
BEGIN
  -- Buscar tema anterior
  SELECT previous_theme_id, selected_theme_id 
  INTO v_previous_theme_id, v_current_theme_id
  FROM public.tenants
  WHERE id = p_tenant_id;

  IF v_previous_theme_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Nenhum tema anterior para reverter'
    );
  END IF;

  -- Reverter
  UPDATE public.tenants
  SET 
    selected_theme_id = v_previous_theme_id,
    previous_theme_id = NULL,
    updated_at = now()
  WHERE id = p_tenant_id;

  -- Registrar auditoria
  INSERT INTO public.admin_logs (action, user_id, tenant_id, meta)
  VALUES (
    'theme.revert',
    p_user_id,
    p_tenant_id,
    jsonb_build_object(
      'reverted_from', v_current_theme_id,
      'reverted_to', v_previous_theme_id,
      'timestamp', now()
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'theme_id', v_previous_theme_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
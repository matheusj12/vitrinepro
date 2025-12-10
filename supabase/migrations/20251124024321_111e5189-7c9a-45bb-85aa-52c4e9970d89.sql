-- Corrigir avisos de segurança: adicionar search_path nas funções

CREATE OR REPLACE FUNCTION public.update_themes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_use_theme(p_tenant_id UUID, p_theme_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_theme_is_premium BOOLEAN;
  v_tenant_plan_slug TEXT;
BEGIN
  -- Buscar se tema é premium
  SELECT is_premium INTO v_theme_is_premium
  FROM public.themes
  WHERE id = p_theme_id AND active = true;

  IF v_theme_is_premium IS NULL THEN
    RETURN false;
  END IF;

  IF v_theme_is_premium = false THEN
    RETURN true;
  END IF;

  SELECT p.slug INTO v_tenant_plan_slug
  FROM public.tenants t
  LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
  LEFT JOIN public.plans p ON p.id = s.plan_id
  WHERE t.id = p_tenant_id
  LIMIT 1;

  IF v_tenant_plan_slug IS NULL OR v_tenant_plan_slug = 'free' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.apply_theme(
  p_tenant_id UUID,
  p_theme_id UUID,
  p_user_id UUID,
  p_is_preview BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_theme_id UUID;
  v_can_use BOOLEAN;
BEGIN
  v_can_use := public.can_use_theme(p_tenant_id, p_theme_id);
  
  IF NOT v_can_use THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Plano não permite usar este tema ou tema inativo'
    );
  END IF;

  SELECT selected_theme_id INTO v_previous_theme_id
  FROM public.tenants
  WHERE id = p_tenant_id;

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

  UPDATE public.tenants
  SET 
    selected_theme_id = p_theme_id,
    previous_theme_id = v_previous_theme_id,
    theme_preview_id = NULL,
    updated_at = now()
  WHERE id = p_tenant_id;

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
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.revert_theme(p_tenant_id UUID, p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_theme_id UUID;
  v_current_theme_id UUID;
BEGIN
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

  UPDATE public.tenants
  SET 
    selected_theme_id = v_previous_theme_id,
    previous_theme_id = NULL,
    updated_at = now()
  WHERE id = p_tenant_id;

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
$$;
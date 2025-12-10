-- ============================================
-- TABELA DE PLANOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  max_products INTEGER NOT NULL DEFAULT -1, -- -1 = ilimitado
  trial_days INTEGER NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para plans
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.plans FOR SELECT
  USING (active = true);

CREATE POLICY "Super admins can manage plans"
  ON public.plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE user_id = auth.uid() AND role = 3
    )
  );

-- ============================================
-- TABELA DE ASSINATURAS (SUBSCRIPTIONS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'trial', -- trial, active, past_due, canceled
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  payment_confirmed BOOLEAN DEFAULT false,
  payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id)
);

-- RLS para subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Super admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE user_id = auth.uid() AND role = 3
    )
  );

-- ============================================
-- TABELA DE LOGS (AUDIT)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  user_id UUID,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all logs"
  ON public.admin_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE user_id = auth.uid() AND role = 3
    )
  );

CREATE POLICY "System can insert logs"
  ON public.admin_logs FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TABELA DE ANALYTICS EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- page_view, product_view, whatsapp_click, quote_created
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_analytics_tenant_type ON public.analytics_events(tenant_id, event_type);
CREATE INDEX idx_analytics_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_product ON public.analytics_events(product_id) WHERE product_id IS NOT NULL;

-- RLS para analytics_events
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own analytics"
  ON public.analytics_events FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics events"
  ON public.analytics_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Super admins can view all analytics"
  ON public.analytics_events FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE user_id = auth.uid() AND role = 3
    )
  );

-- ============================================
-- TABELA DE NOTIFICAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- trial_expiring, store_suspended, payment_confirmed, product_limit
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índice para performance
CREATE INDEX idx_notifications_tenant_read ON public.notifications(tenant_id, read);

-- RLS para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view their own notifications"
  ON public.notifications FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.tenant_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger para updated_at em plans
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para updated_at em subscriptions
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- INSERIR PLANOS PADRÃO
-- ============================================

INSERT INTO public.plans (name, slug, description, price_cents, max_products, trial_days, features, active)
VALUES 
  (
    'Free',
    'free',
    'Ideal para começar seu catálogo online',
    0,
    10,
    0,
    '["Catálogo público simples", "Orçamentos ilimitados", "WhatsApp integrado", "Categorias ilimitadas", "SEO básico", "1 banner", "Suporte limitado"]'::jsonb,
    true
  ),
  (
    'Essencial',
    'essencial',
    'Perfeito para lojas em crescimento',
    4990,
    50,
    7,
    '["Tudo do plano Free", "Variações simples de produto", "Múltiplas imagens por produto", "Banner customizável", "Analytics simplificado", "Suporte prioritário", "Remover marca powered by"]'::jsonb,
    true
  ),
  (
    'Pro',
    'pro',
    'Completo para lojas profissionais',
    12900,
    -1,
    7,
    '["Tudo do Essencial", "Dashboard avançado", "Kanban de orçamentos", "Analytics completo", "Relatórios exportáveis", "Equipe (multiusuários)", "Tema personalizável", "Domínio próprio", "Webhooks", "Suporte premium"]'::jsonb,
    true
  );

-- ============================================
-- ATUALIZAR TRIGGER DE CRIAÇÃO DE TENANT
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user_tenant_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_tenant_id UUID;
  v_user_full_name TEXT := NEW.raw_user_meta_data->>'full_name';
  v_company_name TEXT;
  v_slug TEXT;
  v_default_primary_color TEXT := '#F97316';
  v_default_banner_url TEXT := 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1973&auto=format&fit=crop';
  v_category_id_offers UUID;
  v_category_id_new UUID;
  v_category_id_best_sellers UUID;
  v_attempt INTEGER := 0;
  v_max_attempts INTEGER := 10;
  v_free_plan_id UUID;
BEGIN
  -- Obter ID do plano Free
  SELECT id INTO v_free_plan_id FROM public.plans WHERE slug = 'free' LIMIT 1;

  -- Definir nome da empresa
  IF v_user_full_name IS NOT NULL AND v_user_full_name != '' THEN
    v_company_name := 'Loja de ' || v_user_full_name;
  ELSE
    v_company_name := 'Minha Loja';
  END IF;

  -- Gerar slug único
  LOOP
    v_attempt := v_attempt + 1;
    
    IF v_attempt = 1 THEN
      v_slug := LOWER(REPLACE(REGEXP_REPLACE(v_company_name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-'));
    ELSE
      v_slug := LOWER(REPLACE(REGEXP_REPLACE(v_company_name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-')) || '-' || FLOOR(RANDOM() * 9999)::TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = v_slug) THEN
      EXIT;
    END IF;
    
    IF v_attempt >= v_max_attempts THEN
      v_slug := 'loja-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
      EXIT;
    END IF;
  END LOOP;

  -- Criar tenant
  INSERT INTO public.tenants (
    user_id, company_name, slug, email, whatsapp_number, primary_color,
    subscription_status, trial_ends_at, active
  )
  VALUES (
    NEW.id, v_company_name, v_slug, NEW.email, NULL, v_default_primary_color,
    'trial', NOW() + INTERVAL '7 days', TRUE
  )
  RETURNING id INTO v_tenant_id;

  -- Criar membership
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, NEW.id, 2);

  -- Criar subscription no plano Free
  IF v_free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (tenant_id, plan_id, status, trial_ends_at)
    VALUES (v_tenant_id, v_free_plan_id, 'active', NULL);
  END IF;

  -- Criar store_settings
  INSERT INTO public.store_settings (tenant_id, branding, storefront, contact)
  VALUES (
    v_tenant_id,
    jsonb_build_object('store_title', v_company_name, 'primary_color', v_default_primary_color, 'logo_url', '', 'favicon_url', ''),
    jsonb_build_object('product_card_style', 'classic', 'listing_columns', 3, 'banner_style', 'carousel', 'button_shape', 'rounded', 'button_size', 'medium', 'button_variant', 'filled', 'button_animation', 'shadow', 'show_whatsapp_button', true, 'navbar_style', 'fixed', 'footer_text', '© ' || EXTRACT(YEAR FROM NOW()) || ' ' || v_company_name || '. Todos os direitos reservados.', 'footer_background', '#0f172a', 'footer_text_color', '#f8fafc', 'social', '{}'),
    jsonb_build_object('email', NEW.email, 'whatsapp_number', NULL)
  );

  -- Seed de dados demo
  BEGIN
    INSERT INTO public.categories (tenant_id, name, slug, description)
    VALUES
      (v_tenant_id, 'Ofertas', 'ofertas', 'Produtos em promoção')
      RETURNING id INTO v_category_id_offers;

    INSERT INTO public.categories (tenant_id, name, slug, description)
    VALUES
      (v_tenant_id, 'Novidades', 'novidades', 'Produtos novos')
      RETURNING id INTO v_category_id_new;

    INSERT INTO public.categories (tenant_id, name, slug, description)
    VALUES
      (v_tenant_id, 'Populares', 'populares', 'Produtos mais vendidos')
      RETURNING id INTO v_category_id_best_sellers;

    INSERT INTO public.products (tenant_id, category_id, name, slug, sku, description, price, min_quantity, image_url, featured, active)
    VALUES
      (v_tenant_id, v_category_id_offers, 'Produto Exemplo 1', 'produto-exemplo-1', 'PROD001', 'Descrição do produto 1', 99.90, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06f2e0?w=400', TRUE, TRUE),
      (v_tenant_id, v_category_id_new, 'Produto Exemplo 2', 'produto-exemplo-2', 'PROD002', 'Descrição do produto 2', 149.90, 1, 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400', FALSE, TRUE),
      (v_tenant_id, v_category_id_best_sellers, 'Produto Exemplo 3', 'produto-exemplo-3', 'PROD003', 'Descrição do produto 3', 199.90, 1, 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?w=400', TRUE, TRUE);

    INSERT INTO public.banners (tenant_id, title, subtitle, image_url, link, active, order_position)
    VALUES (v_tenant_id, 'Bem-vindo!', 'Sua loja está pronta', v_default_banner_url, '/loja/' || v_slug, TRUE, 0);
  EXCEPTION
    WHEN OTHERS THEN NULL;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar tenant para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;
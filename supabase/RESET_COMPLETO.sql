-- ===========================================
-- VitrinezApp - RESET COMPLETO DO BANCO
-- ATENÇÃO: Este script DELETA TUDO e recria do zero
-- Execute no SQL Editor do Supabase
-- ===========================================

-- 1. DELETAR TODAS AS POLÍTICAS E TABELAS EXISTENTES
-- ===========================================

-- Desabilitar RLS temporariamente para deletar
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' DISABLE ROW LEVEL SECURITY';
    END LOOP;
END $$;

-- Deletar todas as políticas
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(r.tablename);
    END LOOP;
END $$;

-- Deletar todas as tabelas na ordem correta (dependências)
DROP TABLE IF EXISTS public.admin_logs CASCADE;
DROP TABLE IF EXISTS public.analytics_events CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.email_notifications_sent CASCADE;
DROP TABLE IF EXISTS public.quote_items CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.banners CASCADE;
DROP TABLE IF EXISTS public.store_settings CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.tenant_memberships CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.themes CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;

-- 2. CRIAR TABELAS
-- ===========================================

-- Tabela de planos (sem dependências)
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_cents INTEGER DEFAULT 0,
  max_products INTEGER DEFAULT -1,
  trial_days INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de temas (sem dependências)
CREATE TABLE public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'global',
  description TEXT,
  thumbnail_url TEXT,
  colors JSONB DEFAULT '{}',
  config JSONB DEFAULT '{}',
  is_premium BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System settings (sem dependências)
CREATE TABLE public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de tenants (lojas)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  whatsapp_number TEXT,
  primary_color TEXT DEFAULT '#7c3aed',
  subscription_status TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  active BOOLEAN DEFAULT TRUE,
  custom_domain TEXT,
  custom_domain_verified BOOLEAN DEFAULT FALSE,
  selected_theme_id UUID REFERENCES public.themes(id),
  theme_preview_id UUID,
  previous_theme_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de membros do tenant (roles) - CRÍTICA para RLS
CREATE TABLE public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Tabela de categorias
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Tabela de produtos
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  price DECIMAL(10, 2),
  min_quantity INTEGER DEFAULT 1,
  image_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  stock_control_enabled BOOLEAN DEFAULT FALSE,
  stock_quantity INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, slug)
);

-- Tabela de banners
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  title TEXT,
  subtitle TEXT,
  image_url TEXT,
  link TEXT,
  active BOOLEAN DEFAULT TRUE,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de orçamentos (quotes)
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_whatsapp TEXT NOT NULL,
  observations TEXT,
  message_text TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de itens do orçamento
CREATE TABLE public.quote_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de configurações da loja
CREATE TABLE public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  branding JSONB DEFAULT '{}',
  storefront JSONB DEFAULT '{}',
  contact JSONB DEFAULT '{}',
  theme_id UUID REFERENCES public.themes(id),
  floating_button_icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de assinaturas
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id UUID REFERENCES public.plans(id),
  status TEXT DEFAULT 'trial',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  trial_ends_at TIMESTAMPTZ,
  payment_confirmed BOOLEAN DEFAULT FALSE,
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de analytics
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  meta JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs administrativos
CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id UUID,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HABILITAR RLS
-- ===========================================

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS RLS (SEM RECURSÃO!)
-- ===========================================

-- PLANS: Todos podem ver planos ativos
CREATE POLICY "plans_select" ON public.plans FOR SELECT USING (active = TRUE);

-- THEMES: Todos podem ver temas ativos
CREATE POLICY "themes_select" ON public.themes FOR SELECT USING (active = TRUE);

-- SYSTEM_SETTINGS: Todos podem ver
CREATE POLICY "system_settings_select" ON public.system_settings FOR SELECT USING (TRUE);

-- TENANT_MEMBERSHIPS: IMPORTANTE - Políticas simples sem auto-referência
CREATE POLICY "memberships_select_own" ON public.tenant_memberships 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "memberships_insert_own" ON public.tenant_memberships 
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "memberships_update_own" ON public.tenant_memberships 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "memberships_delete_own" ON public.tenant_memberships 
  FOR DELETE USING (user_id = auth.uid());

-- TENANTS: Usuários veem seus próprios tenants
CREATE POLICY "tenants_select_own" ON public.tenants 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "tenants_insert_auth" ON public.tenants 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "tenants_update_own" ON public.tenants 
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "tenants_delete_own" ON public.tenants 
  FOR DELETE USING (user_id = auth.uid());

-- PRODUCTS: Público pode ver ativos, owners podem gerenciar
CREATE POLICY "products_select_active" ON public.products 
  FOR SELECT USING (active = TRUE);

CREATE POLICY "products_select_owner" ON public.products 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = products.tenant_id AND user_id = auth.uid())
  );

CREATE POLICY "products_insert_owner" ON public.products 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = products.tenant_id AND user_id = auth.uid())
  );

CREATE POLICY "products_update_owner" ON public.products 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = products.tenant_id AND user_id = auth.uid())
  );

CREATE POLICY "products_delete_owner" ON public.products 
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = products.tenant_id AND user_id = auth.uid())
  );

-- CATEGORIES: Similar a products
CREATE POLICY "categories_select_active" ON public.categories 
  FOR SELECT USING (active = TRUE);

CREATE POLICY "categories_select_owner" ON public.categories 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = categories.tenant_id AND user_id = auth.uid())
  );

CREATE POLICY "categories_all_owner" ON public.categories 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = categories.tenant_id AND user_id = auth.uid())
  );

-- BANNERS: Similar a products
CREATE POLICY "banners_select_active" ON public.banners 
  FOR SELECT USING (active = TRUE);

CREATE POLICY "banners_all_owner" ON public.banners 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = banners.tenant_id AND user_id = auth.uid())
  );

-- QUOTES: Público pode criar, owners podem ver
CREATE POLICY "quotes_insert_public" ON public.quotes 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "quotes_select_owner" ON public.quotes 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = quotes.tenant_id AND user_id = auth.uid())
  );

-- QUOTE_ITEMS: Público pode criar
CREATE POLICY "quote_items_insert_public" ON public.quote_items 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "quote_items_select_owner" ON public.quote_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quotes q 
      JOIN public.tenants t ON t.id = q.tenant_id 
      WHERE q.id = quote_items.quote_id AND t.user_id = auth.uid()
    )
  );

-- STORE_SETTINGS: Público pode ver, owners podem editar
CREATE POLICY "store_settings_select_public" ON public.store_settings 
  FOR SELECT USING (TRUE);

CREATE POLICY "store_settings_all_owner" ON public.store_settings 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = store_settings.tenant_id AND user_id = auth.uid())
  );

-- SUBSCRIPTIONS: Owners podem ver
CREATE POLICY "subscriptions_select_owner" ON public.subscriptions 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = subscriptions.tenant_id AND user_id = auth.uid())
  );

-- ANALYTICS_EVENTS: Público pode criar, owners podem ver
CREATE POLICY "analytics_insert_public" ON public.analytics_events 
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "analytics_select_owner" ON public.analytics_events 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = analytics_events.tenant_id AND user_id = auth.uid())
  );

-- NOTIFICATIONS: Owners podem ver e atualizar
CREATE POLICY "notifications_select_owner" ON public.notifications 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = notifications.tenant_id AND user_id = auth.uid())
  );

CREATE POLICY "notifications_update_owner" ON public.notifications 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.tenants WHERE id = notifications.tenant_id AND user_id = auth.uid())
  );

-- ADMIN_LOGS: Apenas service role pode inserir/ver
CREATE POLICY "admin_logs_service" ON public.admin_logs 
  FOR ALL USING (FALSE);

-- 5. ÍNDICES PARA PERFORMANCE
-- ===========================================

CREATE INDEX idx_products_tenant ON public.products(tenant_id);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(active);
CREATE INDEX idx_categories_tenant ON public.categories(tenant_id);
CREATE INDEX idx_quotes_tenant ON public.quotes(tenant_id);
CREATE INDEX idx_quote_items_quote ON public.quote_items(quote_id);
CREATE INDEX idx_tenant_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);
CREATE INDEX idx_analytics_tenant ON public.analytics_events(tenant_id);
CREATE INDEX idx_notifications_tenant ON public.notifications(tenant_id);
CREATE INDEX idx_tenants_user ON public.tenants(user_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- 6. DADOS INICIAIS
-- ===========================================

-- Planos
INSERT INTO public.plans (name, slug, description, price_cents, max_products, trial_days, features, active) VALUES
  ('Grátis', 'free', 'Para testar a plataforma', 0, 10, 0, '["Catálogo básico", "Até 10 produtos", "1 banner", "Marca VitrinezApp"]', TRUE),
  ('Essencial', 'essencial', 'Para começar a vender', 5900, 50, 7, '["Até 50 produtos", "2 banners", "WhatsApp integrado", "1 usuário"]', TRUE),
  ('Pro', 'pro', 'Para quem quer crescer', 12900, -1, 7, '["Produtos ilimitados", "Banners ilimitados", "Temas premium", "Analytics avançado", "Remoção da marca", "Suporte prioritário"]', TRUE);

-- Temas
INSERT INTO public.themes (name, slug, description, colors, config, is_premium, active) VALUES
  ('Classic White', 'classic-white', 'Tema clássico claro e limpo', '{"primary": "262.1 83.3% 57.8%", "background": "0 0% 100%", "foreground": "222.2 84% 4.9%"}', '{"grid": {"columns": {"mobile": 1, "tablet": 2, "desktop": 3}}}', FALSE, TRUE),
  ('Dark Modern', 'dark-modern', 'Tema escuro moderno', '{"primary": "263.4 70% 50.4%", "background": "222.2 84% 4.9%", "foreground": "210 40% 98%"}', '{"grid": {"columns": {"mobile": 1, "tablet": 2, "desktop": 3}}}', FALSE, TRUE),
  ('Candy Soft', 'candy-soft', 'Tema suave e colorido', '{"primary": "330 80% 60%", "background": "0 0% 100%", "foreground": "222.2 84% 4.9%"}', '{"grid": {"columns": {"mobile": 1, "tablet": 2, "desktop": 4}}}', TRUE, TRUE);

-- System settings
INSERT INTO public.system_settings (social) VALUES ('{"icons": {}}');

-- 7. CRIAR SUPER ADMIN
-- ===========================================

DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_plan_id UUID;
BEGIN
  -- Buscar o usuário
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'matheusjuliodeoliveira@gmail.com' LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuário matheusjuliodeoliveira@gmail.com não encontrado!';
    RETURN;
  END IF;
  
  RAISE NOTICE '✓ Usuário encontrado: %', v_user_id;
  
  -- Criar tenant
  INSERT INTO public.tenants (user_id, company_name, slug, email, active, subscription_status)
  VALUES (v_user_id, 'Admin Store', 'admin', 'matheusjuliodeoliveira@gmail.com', TRUE, 'active')
  RETURNING id INTO v_tenant_id;
  
  RAISE NOTICE '✓ Tenant criado: %', v_tenant_id;
  
  -- Criar membership (Super Admin = role 3)
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, v_user_id, 3);
  
  RAISE NOTICE '✓ Membership criada (Super Admin)';
  
  -- Criar store_settings
  INSERT INTO public.store_settings (tenant_id, branding, contact)
  VALUES (v_tenant_id, '{"store_title": "Admin Store", "primary_color": "#7c3aed"}', '{"email": "matheusjuliodeoliveira@gmail.com"}');
  
  RAISE NOTICE '✓ Store settings criadas';
  
  -- Buscar plano Pro
  SELECT id INTO v_plan_id FROM public.plans WHERE slug = 'pro' LIMIT 1;
  
  -- Criar subscription
  INSERT INTO public.subscriptions (tenant_id, plan_id, status, started_at)
  VALUES (v_tenant_id, v_plan_id, 'active', NOW());
  
  RAISE NOTICE '✓ Subscription criada (Plano Pro)';
  RAISE NOTICE '🎉 Super Admin configurado com sucesso!';
  
END $$;

-- 8. VERIFICAÇÃO FINAL
-- ===========================================

SELECT 
  '✅ Setup completo!' as status,
  u.email,
  t.company_name,
  t.slug as vitrine_url,
  CASE tm.role 
    WHEN 1 THEN 'Member'
    WHEN 2 THEN 'Owner'
    WHEN 3 THEN 'Super Admin'
  END as role_name,
  p.name as plano
FROM auth.users u
JOIN public.tenants t ON t.user_id = u.id
JOIN public.tenant_memberships tm ON tm.user_id = u.id AND tm.tenant_id = t.id
LEFT JOIN public.subscriptions s ON s.tenant_id = t.id
LEFT JOIN public.plans p ON p.id = s.plan_id
WHERE u.email = 'matheusjuliodeoliveira@gmail.com';

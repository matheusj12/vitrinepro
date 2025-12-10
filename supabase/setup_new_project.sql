-- ===========================================
-- VitrinezApp - Schema Completo para Novo Projeto
-- Execute este script no SQL Editor do Supabase
-- ===========================================

-- 1. TABELAS PRINCIPAIS
-- ===========================================

-- Tabela de tenants (lojas)
CREATE TABLE IF NOT EXISTS public.tenants (
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
  selected_theme_id UUID,
  theme_preview_id UUID,
  previous_theme_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de membros do tenant (roles)
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role INTEGER NOT NULL DEFAULT 1, -- 1=member, 2=owner, 3=super_admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS public.categories (
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
CREATE TABLE IF NOT EXISTS public.products (
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
CREATE TABLE IF NOT EXISTS public.banners (
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
CREATE TABLE IF NOT EXISTS public.quotes (
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
CREATE TABLE IF NOT EXISTS public.quote_items (
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
CREATE TABLE IF NOT EXISTS public.store_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL UNIQUE,
  branding JSONB DEFAULT '{}',
  storefront JSONB DEFAULT '{}',
  contact JSONB DEFAULT '{}',
  theme_id UUID,
  floating_button_icon_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de planos
CREATE TABLE IF NOT EXISTS public.plans (
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

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS public.subscriptions (
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

-- Tabela de temas
CREATE TABLE IF NOT EXISTS public.themes (
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

-- Tabela de analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
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
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs administrativos
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  user_id UUID,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System settings (global)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  social JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. HABILITAR RLS
-- ===========================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS
-- ===========================================

-- Tenants
CREATE POLICY "Users can view their own tenants" ON public.tenants FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = tenants.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own tenants" ON public.tenants FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = tenants.id AND user_id = auth.uid() AND role >= 2
  ));

CREATE POLICY "Super admins can do everything on tenants" ON public.tenants FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND role = 3
  ));

-- Products
CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT
  USING (active = TRUE OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = products.tenant_id AND user_id = auth.uid()
  ));

CREATE POLICY "Tenant owners can manage products" ON public.products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = products.tenant_id AND user_id = auth.uid() AND role >= 1
  ));

-- Categories
CREATE POLICY "Anyone can view active categories" ON public.categories FOR SELECT
  USING (active = TRUE OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = categories.tenant_id AND user_id = auth.uid()
  ));

CREATE POLICY "Tenant owners can manage categories" ON public.categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = categories.tenant_id AND user_id = auth.uid() AND role >= 1
  ));

-- Banners
CREATE POLICY "Anyone can view active banners" ON public.banners FOR SELECT
  USING (active = TRUE OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = banners.tenant_id AND user_id = auth.uid()
  ));

CREATE POLICY "Tenant owners can manage banners" ON public.banners FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = banners.tenant_id AND user_id = auth.uid() AND role >= 1
  ));

-- Quotes
CREATE POLICY "Anyone can create quotes" ON public.quotes FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Tenant owners can view quotes" ON public.quotes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = quotes.tenant_id AND user_id = auth.uid()
  ));

-- Quote items
CREATE POLICY "Anyone can create quote items" ON public.quote_items FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Tenant owners can view quote items" ON public.quote_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.tenant_memberships tm ON tm.tenant_id = q.tenant_id
    WHERE q.id = quote_items.quote_id AND tm.user_id = auth.uid()
  ));

-- Store settings
CREATE POLICY "Anyone can view store settings" ON public.store_settings FOR SELECT USING (TRUE);

CREATE POLICY "Tenant owners can manage settings" ON public.store_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = store_settings.tenant_id AND user_id = auth.uid() AND role >= 1
  ));

-- Tenant memberships
CREATE POLICY "Users can view their memberships" ON public.tenant_memberships FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Super admins can manage memberships" ON public.tenant_memberships FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND role = 3
  ));

-- Plans
CREATE POLICY "Anyone can view active plans" ON public.plans FOR SELECT USING (active = TRUE);

CREATE POLICY "Super admins can manage plans" ON public.plans FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND role = 3
  ));

-- Subscriptions
CREATE POLICY "Tenant owners can view subscriptions" ON public.subscriptions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = subscriptions.tenant_id AND user_id = auth.uid()
  ));

-- Themes
CREATE POLICY "Anyone can view active themes" ON public.themes FOR SELECT USING (active = TRUE);

CREATE POLICY "Super admins can manage themes" ON public.themes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND role = 3
  ));

-- Analytics
CREATE POLICY "Anyone can create analytics events" ON public.analytics_events FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Tenant owners can view analytics" ON public.analytics_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = analytics_events.tenant_id AND user_id = auth.uid()
  ));

-- Notifications
CREATE POLICY "Tenant owners can view notifications" ON public.notifications FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = notifications.tenant_id AND user_id = auth.uid()
  ));

CREATE POLICY "Tenant owners can update notifications" ON public.notifications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = notifications.tenant_id AND user_id = auth.uid()
  ));

-- Admin logs
CREATE POLICY "Super admins can view logs" ON public.admin_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND role = 3
  ));

-- System settings
CREATE POLICY "Anyone can view system settings" ON public.system_settings FOR SELECT USING (TRUE);

CREATE POLICY "Super admins can manage system settings" ON public.system_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND role = 3
  ));

-- 4. ÍNDICES PARA PERFORMANCE
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_products_tenant ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON public.categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON public.quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_tenant ON public.analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_notifications_tenant ON public.notifications(tenant_id);

-- 5. DADOS INICIAIS
-- ===========================================

-- Inserir planos padrão
INSERT INTO public.plans (name, slug, description, price_cents, max_products, trial_days, features, active) VALUES
  ('Grátis', 'free', 'Para testar a plataforma', 0, 10, 0, '["Catálogo básico", "Até 10 produtos", "1 banner", "Marca VitrinezApp"]', TRUE),
  ('Essencial', 'essencial', 'Para começar a vender', 5900, 50, 7, '["Até 50 produtos", "2 banners", "WhatsApp integrado", "1 usuário"]', TRUE),
  ('Pro', 'pro', 'Para quem quer crescer', 12900, -1, 7, '["Produtos ilimitados", "Banners ilimitados", "Temas premium", "Analytics avançado", "Remoção da marca", "Suporte prioritário"]', TRUE)
ON CONFLICT (slug) DO NOTHING;

-- Inserir temas padrão
INSERT INTO public.themes (name, slug, description, colors, config, is_premium, active) VALUES
  ('Classic White', 'classic-white', 'Tema clássico claro e limpo', '{"primary": "262.1 83.3% 57.8%", "background": "0 0% 100%", "foreground": "222.2 84% 4.9%"}', '{"grid": {"columns": {"mobile": 1, "tablet": 2, "desktop": 3}}}', FALSE, TRUE),
  ('Dark Modern', 'dark-modern', 'Tema escuro moderno', '{"primary": "263.4 70% 50.4%", "background": "222.2 84% 4.9%", "foreground": "210 40% 98%"}', '{"grid": {"columns": {"mobile": 1, "tablet": 2, "desktop": 3}}}', FALSE, TRUE),
  ('Candy Soft', 'candy-soft', 'Tema suave e colorido', '{"primary": "330 80% 60%", "background": "0 0% 100%", "foreground": "222.2 84% 4.9%"}', '{"grid": {"columns": {"mobile": 1, "tablet": 2, "desktop": 4}}}', TRUE, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- System settings
INSERT INTO public.system_settings (social) VALUES ('{"icons": {}}')
ON CONFLICT DO NOTHING;

-- 6. CRIAR SUPER ADMIN
-- ===========================================

-- Pegar o user_id do usuário criado e criar tenant + membership
DO $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Buscar o usuário pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'matheusjuliodeoliveira@gmail.com' LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Criar tenant para o admin
    INSERT INTO public.tenants (user_id, company_name, slug, email, active)
    VALUES (v_user_id, 'Admin Store', 'admin', 'matheusjuliodeoliveira@gmail.com', TRUE)
    ON CONFLICT (slug) DO UPDATE SET user_id = EXCLUDED.user_id
    RETURNING id INTO v_tenant_id;
    
    -- Criar membership como Super Admin (role = 3)
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
    VALUES (v_tenant_id, v_user_id, 3)
    ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = 3;
    
    -- Criar store_settings
    INSERT INTO public.store_settings (tenant_id, branding, contact)
    VALUES (v_tenant_id, '{"store_title": "Admin Store", "primary_color": "#7c3aed"}', '{"whatsapp_number": "", "email": "matheusjuliodeoliveira@gmail.com"}')
    ON CONFLICT (tenant_id) DO NOTHING;
    
    -- Criar subscription no plano Pro
    INSERT INTO public.subscriptions (tenant_id, plan_id, status, started_at)
    SELECT v_tenant_id, id, 'active', NOW()
    FROM public.plans WHERE slug = 'pro'
    ON CONFLICT (tenant_id) DO NOTHING;
    
    RAISE NOTICE 'Super Admin criado com sucesso! User ID: %, Tenant ID: %', v_user_id, v_tenant_id;
  ELSE
    RAISE NOTICE 'Usuário não encontrado. Verifique se o email está correto.';
  END IF;
END $$;

-- Verificar se deu certo
SELECT 
  u.email,
  t.company_name,
  t.slug,
  tm.role as role_level,
  CASE tm.role 
    WHEN 1 THEN 'Member'
    WHEN 2 THEN 'Owner'
    WHEN 3 THEN 'Super Admin'
  END as role_name
FROM auth.users u
JOIN public.tenants t ON t.user_id = u.id
JOIN public.tenant_memberships tm ON tm.user_id = u.id AND tm.tenant_id = t.id
WHERE u.email = 'matheusjuliodeoliveira@gmail.com';

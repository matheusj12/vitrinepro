-- Primeiro, verificar e criar tabelas se não existirem

-- Tabela de tenants (lojas)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT,
  whatsapp_number TEXT,
  primary_color TEXT DEFAULT '#F97316',
  subscription_status TEXT DEFAULT 'trial',
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de membros do tenant (roles)
CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para tenants (owners podem ver/editar)
DROP POLICY IF EXISTS "Users can view their own tenants" ON public.tenants;
CREATE POLICY "Users can view their own tenants"
  ON public.tenants FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = tenants.id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update their own tenants" ON public.tenants;
CREATE POLICY "Users can update their own tenants"
  ON public.tenants FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = tenants.id AND user_id = auth.uid() AND role >= 2
  ));

-- Políticas para produtos (público pode ler, owners podem gerenciar)
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (active = TRUE OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = products.tenant_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Tenant owners can manage products" ON public.products;
CREATE POLICY "Tenant owners can manage products"
  ON public.products FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = products.tenant_id AND user_id = auth.uid() AND role >= 1
  ));

-- Políticas para categorias (público pode ler, owners podem gerenciar)
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
CREATE POLICY "Anyone can view active categories"
  ON public.categories FOR SELECT
  USING (active = TRUE OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = categories.tenant_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Tenant owners can manage categories" ON public.categories;
CREATE POLICY "Tenant owners can manage categories"
  ON public.categories FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = categories.tenant_id AND user_id = auth.uid() AND role >= 1
  ));

-- Políticas para banners (público pode ler, owners podem gerenciar)
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
CREATE POLICY "Anyone can view active banners"
  ON public.banners FOR SELECT
  USING (active = TRUE OR EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = banners.tenant_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Tenant owners can manage banners" ON public.banners;
CREATE POLICY "Tenant owners can manage banners"
  ON public.banners FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = banners.tenant_id AND user_id = auth.uid() AND role >= 1
  ));

-- Políticas para quotes (clientes podem criar, owners podem ler)
DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;
CREATE POLICY "Anyone can create quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Tenant owners can view quotes" ON public.quotes;
CREATE POLICY "Tenant owners can view quotes"
  ON public.quotes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = quotes.tenant_id AND user_id = auth.uid()
  ));

-- Políticas para quote_items (clientes podem criar, owners podem ler)
DROP POLICY IF EXISTS "Anyone can create quote items" ON public.quote_items;
CREATE POLICY "Anyone can create quote items"
  ON public.quote_items FOR INSERT
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Tenant owners can view quote items" ON public.quote_items;
CREATE POLICY "Tenant owners can view quote items"
  ON public.quote_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quotes q
    JOIN public.tenant_memberships tm ON tm.tenant_id = q.tenant_id
    WHERE q.id = quote_items.quote_id AND tm.user_id = auth.uid()
  ));

-- Políticas para store_settings (owners podem gerenciar)
DROP POLICY IF EXISTS "Anyone can view store settings" ON public.store_settings;
CREATE POLICY "Anyone can view store settings"
  ON public.store_settings FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Tenant owners can manage settings" ON public.store_settings;
CREATE POLICY "Tenant owners can manage settings"
  ON public.store_settings FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = store_settings.tenant_id AND user_id = auth.uid() AND role >= 1
  ));

-- Políticas para tenant_memberships
DROP POLICY IF EXISTS "Users can view their memberships" ON public.tenant_memberships;
CREATE POLICY "Users can view their memberships"
  ON public.tenant_memberships FOR SELECT
  USING (user_id = auth.uid());

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_products_tenant ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON public.categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant ON public.quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user ON public.tenant_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);
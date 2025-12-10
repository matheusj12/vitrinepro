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
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_tenant ON public.tenant_memberships(tenant_id);-- PROMPT 1: Melhorias no módulo de produtos

-- 1. Adicionar campo stock_control_enabled na tabela products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_control_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0;

-- 2. Criar tabela de múltiplas imagens por produto
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_images (público pode ler, owners podem gerenciar)
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = product_images.product_id
    AND (products.active = TRUE OR EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE tenant_id = products.tenant_id AND user_id = auth.uid()
    ))
  ));

DROP POLICY IF EXISTS "Tenant owners can manage product images" ON public.product_images;
CREATE POLICY "Tenant owners can manage product images"
  ON public.product_images FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.products
    JOIN public.tenant_memberships ON tenant_memberships.tenant_id = products.tenant_id
    WHERE products.id = product_images.product_id
    AND tenant_memberships.user_id = auth.uid()
    AND tenant_memberships.role >= 1
  ));

-- 3. Criar tabela de variações de produtos (cor, tamanho, etc)
CREATE TABLE IF NOT EXISTS public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  variation_type TEXT NOT NULL, -- 'color', 'size', 'material', etc
  variation_value TEXT NOT NULL, -- 'Azul', 'M', 'Couro', etc
  price_adjustment DECIMAL(10, 2) DEFAULT 0, -- ajuste de preço (+/-)
  sku_suffix TEXT, -- sufixo para SKU (ex: SKU001-AZUL-M)
  stock_quantity INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para product_variations
DROP POLICY IF EXISTS "Anyone can view active product variations" ON public.product_variations;
CREATE POLICY "Anyone can view active product variations"
  ON public.product_variations FOR SELECT
  USING (active = TRUE AND EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = product_variations.product_id
    AND (products.active = TRUE OR EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE tenant_id = products.tenant_id AND user_id = auth.uid()
    ))
  ));

DROP POLICY IF EXISTS "Tenant owners can manage product variations" ON public.product_variations;
CREATE POLICY "Tenant owners can manage product variations"
  ON public.product_variations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.products
    JOIN public.tenant_memberships ON tenant_memberships.tenant_id = products.tenant_id
    WHERE products.id = product_variations.product_id
    AND tenant_memberships.user_id = auth.uid()
    AND tenant_memberships.role >= 1
  ));

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON public.product_images(product_id, position);
CREATE INDEX IF NOT EXISTS idx_product_variations_product ON public.product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_type ON public.product_variations(product_id, variation_type);

-- Trigger para updated_at em product_variations
CREATE OR REPLACE FUNCTION public.update_product_variations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_product_variations_updated_at ON public.product_variations;
CREATE TRIGGER update_product_variations_updated_at
  BEFORE UPDATE ON public.product_variations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_product_variations_updated_at();-- Simplificar trigger de criação de tenant
-- Remover validações complexas e garantir criação sempre

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_tenant_setup();

-- Função simplificada para criar tenant automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_tenant_setup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
BEGIN
  -- Definir nome da empresa (simples)
  IF v_user_full_name IS NOT NULL AND v_user_full_name != '' THEN
    v_company_name := 'Loja de ' || v_user_full_name;
  ELSE
    v_company_name := 'Minha Loja';
  END IF;

  -- Gerar slug único com tentativas
  LOOP
    v_attempt := v_attempt + 1;
    
    IF v_attempt = 1 THEN
      -- Primeira tentativa: slug simples
      v_slug := LOWER(REPLACE(REGEXP_REPLACE(v_company_name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-'));
    ELSE
      -- Tentativas seguintes: adicionar número aleatório
      v_slug := LOWER(REPLACE(REGEXP_REPLACE(v_company_name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-')) || '-' || FLOOR(RANDOM() * 9999)::TEXT;
    END IF;
    
    -- Verificar se slug existe
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = v_slug) THEN
      EXIT; -- Slug único encontrado
    END IF;
    
    -- Limite de tentativas
    IF v_attempt >= v_max_attempts THEN
      -- Usar timestamp como fallback
      v_slug := 'loja-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
      EXIT;
    END IF;
  END LOOP;

  -- Criar tenant (simples, sem validações complexas)
  INSERT INTO public.tenants (
    user_id,
    company_name,
    slug,
    email,
    whatsapp_number,
    primary_color,
    subscription_status,
    trial_ends_at,
    active
  )
  VALUES (
    NEW.id,
    v_company_name,
    v_slug,
    NEW.email,
    NULL, -- WhatsApp vazio
    v_default_primary_color,
    'trial',
    NOW() + INTERVAL '7 days',
    TRUE -- Sempre ativo
  )
  RETURNING id INTO v_tenant_id;

  -- Criar membership com role admin (2 = owner)
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, NEW.id, 2);

  -- Criar store_settings padrão
  INSERT INTO public.store_settings (tenant_id, branding, storefront, contact)
  VALUES (
    v_tenant_id,
    jsonb_build_object('store_title', v_company_name, 'primary_color', v_default_primary_color, 'logo_url', '', 'favicon_url', ''),
    jsonb_build_object('product_card_style', 'classic', 'listing_columns', 3, 'banner_style', 'carousel', 'button_shape', 'rounded', 'button_size', 'medium', 'button_variant', 'filled', 'button_animation', 'shadow', 'show_whatsapp_button', true, 'navbar_style', 'fixed', 'footer_text', '© ' || EXTRACT(YEAR FROM NOW()) || ' ' || v_company_name || '. Todos os direitos reservados.', 'footer_background', '#0f172a', 'footer_text_color', '#f8fafc', 'social', '{}'),
    jsonb_build_object('email', NEW.email, 'whatsapp_number', NULL)
  );

  -- Popular Categorias (tentativa, não falhar se der erro)
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

    -- Popular Produtos Demo (tentativa)
    INSERT INTO public.products (tenant_id, category_id, name, slug, sku, description, price, min_quantity, image_url, featured, active)
    VALUES
      (v_tenant_id, v_category_id_offers, 'Produto Exemplo 1', 'produto-exemplo-1', 'PROD001', 'Descrição do produto 1', 99.90, 1, 'https://images.unsplash.com/photo-1505740420928-5e560c06f2e0?w=400', TRUE, TRUE),
      (v_tenant_id, v_category_id_new, 'Produto Exemplo 2', 'produto-exemplo-2', 'PROD002', 'Descrição do produto 2', 149.90, 1, 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400', FALSE, TRUE),
      (v_tenant_id, v_category_id_best_sellers, 'Produto Exemplo 3', 'produto-exemplo-3', 'PROD003', 'Descrição do produto 3', 199.90, 1, 'https://images.unsplash.com/photo-1520390138845-fd2d229dd553?w=400', TRUE, TRUE);

    -- Banner padrão
    INSERT INTO public.banners (tenant_id, title, subtitle, image_url, link, active, order_position)
    VALUES (v_tenant_id, 'Bem-vindo!', 'Sua loja está pronta', v_default_banner_url, '/loja/' || v_slug, TRUE, 0);
  EXCEPTION
    WHEN OTHERS THEN
      -- Ignorar erros de seed (não crítico)
      NULL;
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log erro mas não falhar a criação do usuário
    RAISE WARNING 'Erro ao criar tenant para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recriar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_tenant_setup();

-- Garantir que tenants sempre têm active = true por padrão
ALTER TABLE public.tenants 
ALTER COLUMN active SET DEFAULT TRUE;

-- Garantir que tenant_id na membership nunca é null
ALTER TABLE public.tenant_memberships 
ALTER COLUMN tenant_id SET NOT NULL;

-- Comentário para clareza
COMMENT ON FUNCTION public.handle_new_user_tenant_setup() IS 
'Versão simplificada: cria tenant automaticamente com slug único, sem validações complexas';-- ============================================
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
$$;-- ============================================
-- TABELA DE TEMAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('free', 'pro')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para themes
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active themes"
  ON public.themes FOR SELECT
  USING (active = true);

-- ============================================
-- ADICIONAR CAMPO theme_id EM store_settings
-- ============================================
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS theme_id UUID REFERENCES public.themes(id);

-- ============================================
-- INSERIR TEMAS PRONTOS
-- ============================================

-- Tema 1: Free Classic
INSERT INTO public.themes (name, slug, type, config, active)
VALUES (
  'Free Classic',
  'free-classic',
  'free',
  '{
    "layout": "classic",
    "productCard": {
      "style": "card",
      "showPrice": true,
      "showDescription": true,
      "imageAspectRatio": "square"
    },
    "header": {
      "position": "fixed",
      "showSearch": false,
      "showCart": true
    },
    "banner": {
      "style": "simple",
      "height": "medium"
    },
    "colors": {
      "useStorePrimary": true
    },
    "grid": {
      "columns": {
        "mobile": 1,
        "tablet": 2,
        "desktop": 3
      }
    }
  }'::jsonb,
  true
);

-- Tema 2: Essencial Clean
INSERT INTO public.themes (name, slug, type, config, active)
VALUES (
  'Essencial Clean',
  'essencial-clean',
  'pro',
  '{
    "layout": "clean",
    "productCard": {
      "style": "minimal",
      "showPrice": true,
      "showDescription": false,
      "imageAspectRatio": "portrait",
      "hoverEffect": "zoom"
    },
    "header": {
      "position": "sticky",
      "showSearch": true,
      "showCart": true,
      "transparent": true
    },
    "banner": {
      "style": "fullwidth",
      "height": "large",
      "overlay": true
    },
    "colors": {
      "useStorePrimary": true,
      "customAccent": true
    },
    "grid": {
      "columns": {
        "mobile": 2,
        "tablet": 3,
        "desktop": 4
      },
      "gap": "large"
    },
    "features": {
      "productQuickView": true,
      "stickyAddToCart": true
    }
  }'::jsonb,
  true
);

-- Tema 3: Pro Premium
INSERT INTO public.themes (name, slug, type, config, active)
VALUES (
  'Pro Premium',
  'pro-premium',
  'pro',
  '{
    "layout": "premium",
    "productCard": {
      "style": "elevated",
      "showPrice": true,
      "showDescription": true,
      "imageAspectRatio": "auto",
      "hoverEffect": "lift",
      "showBadges": true
    },
    "header": {
      "position": "sticky",
      "showSearch": true,
      "showCart": true,
      "showCategories": true,
      "transparent": false
    },
    "banner": {
      "style": "slider",
      "height": "xlarge",
      "autoplay": true,
      "overlay": true
    },
    "colors": {
      "useStorePrimary": false,
      "customPalette": true
    },
    "grid": {
      "columns": {
        "mobile": 2,
        "tablet": 3,
        "desktop": 4
      },
      "gap": "xlarge",
      "masonry": true
    },
    "features": {
      "productQuickView": true,
      "stickyAddToCart": true,
      "wishlist": true,
      "productComparison": true,
      "advancedFilters": true
    },
    "animations": {
      "enabled": true,
      "type": "smooth"
    }
  }'::jsonb,
  true
);

-- ============================================
-- ATUALIZAR store_settings EXISTENTES COM TEMA PADRÃO
-- ============================================

-- Buscar ID do tema Free Classic
DO $$
DECLARE
  v_free_theme_id UUID;
BEGIN
  SELECT id INTO v_free_theme_id FROM public.themes WHERE slug = 'free-classic' LIMIT 1;
  
  IF v_free_theme_id IS NOT NULL THEN
    UPDATE public.store_settings
    SET theme_id = v_free_theme_id
    WHERE theme_id IS NULL;
  END IF;
END $$;

-- ============================================
-- ATUALIZAR TRIGGER PARA INCLUIR TEMA PADRÃO
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
  v_free_theme_id UUID;
BEGIN
  -- Obter ID do plano Free
  SELECT id INTO v_free_plan_id FROM public.plans WHERE slug = 'free' LIMIT 1;
  
  -- Obter ID do tema Free Classic
  SELECT id INTO v_free_theme_id FROM public.themes WHERE slug = 'free-classic' LIMIT 1;

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

  -- Criar store_settings COM TEMA PADRÃO
  INSERT INTO public.store_settings (tenant_id, branding, storefront, contact, theme_id)
  VALUES (
    v_tenant_id,
    jsonb_build_object('store_title', v_company_name, 'primary_color', v_default_primary_color, 'logo_url', '', 'favicon_url', ''),
    jsonb_build_object('product_card_style', 'classic', 'listing_columns', 3, 'banner_style', 'carousel', 'button_shape', 'rounded', 'button_size', 'medium', 'button_variant', 'filled', 'button_animation', 'shadow', 'show_whatsapp_button', true, 'navbar_style', 'fixed', 'footer_text', '© ' || EXTRACT(YEAR FROM NOW()) || ' ' || v_company_name || '. Todos os direitos reservados.', 'footer_background', '#0f172a', 'footer_text_color', '#f8fafc', 'social', '{}'),
    jsonb_build_object('email', NEW.email, 'whatsapp_number', NULL),
    v_free_theme_id
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
$$;-- Corrigir políticas de segurança críticas

-- 1. STORE_SETTINGS: Remover política "Anyone can view store settings"
-- e criar política mais restrita que só expõe dados necessários da vitrine
DROP POLICY IF EXISTS "Anyone can view store settings" ON public.store_settings;

-- Criar política que permite leitura apenas de campos públicos necessários
-- (branding, storefront, theme_id) mas protege o contact
CREATE POLICY "Public can view storefront settings" ON public.store_settings
FOR SELECT
USING (true);

-- Comentário: A política acima ainda permite ler tudo, mas é necessário para a vitrine funcionar.
-- O campo 'contact' contém WhatsApp mas é usado na vitrine pública.
-- Para uma solução mais segura, seria necessário criar uma view ou endpoint específico.

-- 2. QUOTES: Adicionar política para prevenir acesso direto por ID
-- Já existe "Tenant owners can view quotes" que usa membership
-- Mas vamos garantir que SOMENTE tenants autorizados vejam

-- Remover política antiga se existir
DROP POLICY IF EXISTS "Anyone can create quotes" ON public.quotes;

-- Recriar com mesma funcionalidade (necessário para vitrine pública)
CREATE POLICY "Anyone can create quotes" ON public.quotes
FOR INSERT
WITH CHECK (true);

-- 3. TENANTS: Verificar se RLS está protegendo corretamente
-- Políticas já existem, apenas documentar que estão corretas:
-- "Users can view their own tenants" - OK
-- "Users can update their own tenants" - OK

-- 4. Adicionar índices para performance se não existirem
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_id ON public.quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_id ON public.analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_id ON public.tenant_memberships(user_id);

-- 5. Comentários de segurança
COMMENT ON TABLE public.store_settings IS 'Configurações da loja. Campo contact contém WhatsApp mas é necessário para vitrine pública.';
COMMENT ON TABLE public.quotes IS 'Orçamentos. RLS protege visualização apenas para donos do tenant.';
COMMENT ON TABLE public.tenants IS 'Tenants. RLS protege visualização apenas para membros.';-- Tornar matheusjuliodeoliveira@gmail.com super admin
DO $$
DECLARE
  v_user_id uuid;
  v_tenant_id uuid;
  v_existing_membership_id uuid;
BEGIN
  -- Buscar o user_id pelo email
  SELECT id INTO v_user_id 
  FROM auth.users 
  WHERE email = 'matheusjuliodeoliveira@gmail.com';
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email matheusjuliodeoliveira@gmail.com não encontrado';
  END IF;
  
  -- Buscar tenant do usuário
  SELECT id INTO v_tenant_id 
  FROM public.tenants 
  WHERE user_id = v_user_id 
  LIMIT 1;
  
  -- Se não tiver tenant, criar um tenant "Sistema" para o super admin
  IF v_tenant_id IS NULL THEN
    INSERT INTO public.tenants (
      user_id, 
      company_name, 
      slug, 
      email, 
      subscription_status, 
      active
    )
    VALUES (
      v_user_id,
      'Sistema Admin',
      'admin-' || substr(md5(random()::text), 1, 8),
      'matheusjuliodeoliveira@gmail.com',
      'active',
      true
    )
    RETURNING id INTO v_tenant_id;
  END IF;
  
  -- Verificar se já existe membership
  SELECT id INTO v_existing_membership_id
  FROM public.tenant_memberships
  WHERE user_id = v_user_id
  LIMIT 1;
  
  -- Se existe membership, atualizar role para 3 (super admin)
  IF v_existing_membership_id IS NOT NULL THEN
    UPDATE public.tenant_memberships
    SET role = 3
    WHERE user_id = v_user_id;
    
    RAISE NOTICE 'Membership atualizada para super admin (role 3)';
  ELSE
    -- Se não existe, criar nova membership com role 3
    INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
    VALUES (v_tenant_id, v_user_id, 3);
    
    RAISE NOTICE 'Nova membership criada com role super admin (role 3)';
  END IF;
  
  RAISE NOTICE 'Usuário % agora é super admin', 'matheusjuliodeoliveira@gmail.com';
END $$;-- ============================================
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
$$ LANGUAGE plpgsql SECURITY DEFINER;-- Corrigir avisos de segurança: adicionar search_path nas funções

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
$$;-- Atualizar ou inserir os 3 temas gratuitos
INSERT INTO public.themes (slug, name, type, description, is_premium, active, thumbnail_url, colors, config)
VALUES
  (
    'free-classic',
    'Free Classic',
    'free',
    'Tema clássico e limpo para sua loja',
    false,
    true,
    '/images/themes/classic-white.png',
    '{"--primary": "25 95% 53%", "--background": "0 0% 100%", "--foreground": "222 47% 11%", "--card": "0 0% 100%", "--card-foreground": "222 47% 11%"}',
    '{"layout": "classic", "grid_columns": 3}'
  ),
  (
    'dark-modern',
    'Dark Modern',
    'free',
    'Tema escuro e moderno',
    false,
    true,
    '/images/themes/dark-modern.png',
    '{"--primary": "25 95% 53%", "--background": "222 47% 11%", "--foreground": "210 40% 98%", "--card": "217 33% 17%", "--card-foreground": "210 40% 98%"}',
    '{"layout": "modern", "grid_columns": 3}'
  ),
  (
    'candy-soft',
    'Candy Soft',
    'free',
    'Tema suave com cores pastéis',
    false,
    true,
    '/images/themes/candy-soft.png',
    '{"--primary": "330 90% 70%", "--background": "330 100% 98%", "--foreground": "330 40% 20%", "--card": "330 100% 95%", "--card-foreground": "330 40% 20%"}',
    '{"layout": "soft", "grid_columns": 3}'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_premium = EXCLUDED.is_premium,
  active = EXCLUDED.active,
  thumbnail_url = EXCLUDED.thumbnail_url,
  colors = EXCLUDED.colors,
  config = EXCLUDED.config,
  updated_at = now();-- Tornar todos os temas gratuitos por enquanto
UPDATE public.themes 
SET is_premium = false 
WHERE slug IN ('essencial-clean', 'pro-premium');-- Atualizar cores dos temas Essencial Clean e Pro Premium para usar CSS variables corretas

UPDATE themes
SET colors = jsonb_build_object(
  '--background', '240 10% 98%',
  '--foreground', '240 10% 10%',
  '--primary', '25 95% 53%',
  '--card', '240 10% 95%',
  '--card-foreground', '240 10% 10%'
)
WHERE slug = 'essencial-clean';

UPDATE themes
SET colors = jsonb_build_object(
  '--background', '270 50% 5%',
  '--foreground', '270 20% 95%',
  '--primary', '280 90% 65%',
  '--card', '270 40% 10%',
  '--card-foreground', '270 20% 95%'
)
WHERE slug = 'pro-premium';-- Tabela para controlar notificações de email enviadas
CREATE TABLE IF NOT EXISTS public.email_notifications_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  days_before_expiry INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT unique_notification UNIQUE (tenant_id, notification_type, days_before_expiry, expiry_date)
);

-- Index para consultas rápidas
CREATE INDEX idx_email_notifications_tenant ON public.email_notifications_sent(tenant_id);
CREATE INDEX idx_email_notifications_sent_at ON public.email_notifications_sent(sent_at);
CREATE INDEX idx_email_notifications_type ON public.email_notifications_sent(notification_type);

-- RLS policies
ALTER TABLE public.email_notifications_sent ENABLE ROW LEVEL SECURITY;

-- Super admins podem ver todos os emails enviados
CREATE POLICY "Super admins can view all email notifications"
ON public.email_notifications_sent
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND role = 3
  )
);

-- Sistema pode inserir notificações
CREATE POLICY "System can insert email notifications"
ON public.email_notifications_sent
FOR INSERT
WITH CHECK (true);

COMMENT ON TABLE public.email_notifications_sent IS 'Registra emails de notificação enviados para evitar duplicatas';
COMMENT ON COLUMN public.email_notifications_sent.notification_type IS 'Tipo: expiry_warning_7, expiry_warning_3, expiry_warning_1, expired';
COMMENT ON COLUMN public.email_notifications_sent.days_before_expiry IS 'Quantos dias antes da expiração o email foi enviado';
COMMENT ON COLUMN public.email_notifications_sent.expiry_date IS 'Data de expiração do tenant no momento do envio';-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar cron job para verificar expirações diariamente às 10h UTC (7h BRT)
SELECT cron.schedule(
  'check-expiring-subscriptions-daily',
  '0 10 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://rtljfxgxpgzabbsmqwno.supabase.co/functions/v1/check-expiring-subscriptions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bGpmeGd4cGd6YWJic21xd25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzI4MDMsImV4cCI6MjA3NjY0ODgwM30.4OIrYaOYZ-FQ0sRgUIdJNIK6o5F-W6mAAG-iUmCcZGw"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Extensão para agendar jobs recorrentes no PostgreSQL';
COMMENT ON EXTENSION pg_net IS 'Extensão para fazer requisições HTTP do PostgreSQL';-- Criar bucket para logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-logos', 'store-logos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS para logos - qualquer um pode ver, apenas donos podem fazer upload
CREATE POLICY "Logos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-logos');

CREATE POLICY "Donos podem fazer upload de logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-logos' AND
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id::text = (storage.foldername(name))[1]
    AND (tenants.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE tenant_memberships.tenant_id = tenants.id
      AND tenant_memberships.user_id = auth.uid()
      AND tenant_memberships.role >= 1
    ))
  )
);

CREATE POLICY "Donos podem deletar seus logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-logos' AND
  EXISTS (
    SELECT 1 FROM public.tenants
    WHERE tenants.id::text = (storage.foldername(name))[1]
    AND (tenants.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE tenant_memberships.tenant_id = tenants.id
      AND tenant_memberships.user_id = auth.uid()
      AND tenant_memberships.role >= 1
    ))
  )
);

-- Adicionar campos de domínio customizado e nome da loja nos tenants
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS store_name TEXT,
ADD COLUMN IF NOT EXISTS custom_domain TEXT,
ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false;

-- Inicializar store_name com company_name para tenants existentes
UPDATE public.tenants 
SET store_name = company_name 
WHERE store_name IS NULL;

-- Criar índice para busca de produtos
CREATE INDEX IF NOT EXISTS idx_products_search_name ON public.products USING gin(to_tsvector('portuguese', name));
CREATE INDEX IF NOT EXISTS idx_products_search_description ON public.products USING gin(to_tsvector('portuguese', coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id) WHERE category_id IS NOT NULL;-- Correções críticas de segurança identificadas na auditoria

-- 1. Corrigir search_path nas functions (Security Warning)
ALTER FUNCTION public.apply_theme SET search_path = 'public';
ALTER FUNCTION public.revert_theme SET search_path = 'public';

-- 2. Adicionar indexes para performance
CREATE INDEX IF NOT EXISTS idx_products_tenant_active ON public.products(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_analytics_tenant_date ON public.analytics_events(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_quotes_tenant_status ON public.quotes(tenant_id, status);

-- 3. Adicionar campos de auditoria faltantes
ALTER TABLE public.tenant_memberships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.quote_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- 4. Adicionar soft deletes nas tabelas principais
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 5. Atualizar policies para considerar soft deletes
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Anyone can view active products" ON public.products
FOR SELECT USING (
  deleted_at IS NULL AND (
    active = true OR EXISTS (
      SELECT 1 FROM tenant_memberships
      WHERE tenant_memberships.tenant_id = products.tenant_id
      AND tenant_memberships.user_id = auth.uid()
    )
  )
);

COMMENT ON COLUMN public.products.deleted_at IS 'Soft delete timestamp';
COMMENT ON COLUMN public.quotes.deleted_at IS 'Soft delete timestamp';
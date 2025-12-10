-- ============================================
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
$$;
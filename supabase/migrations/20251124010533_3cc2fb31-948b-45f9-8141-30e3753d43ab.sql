-- Simplificar trigger de criação de tenant
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
'Versão simplificada: cria tenant automaticamente com slug único, sem validações complexas';
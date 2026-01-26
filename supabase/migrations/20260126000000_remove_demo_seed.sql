
-- Atualiza a função handle_new_user_tenant_setup para NÃO CRIAR MAIS dados de demonstração.
-- Novos usuários começarão com a loja zerada (sem produtos, categorias ou banners).

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
  v_attempt INTEGER := 0;
  v_max_attempts INTEGER := 10;
  v_free_plan_id UUID;
  v_free_theme_id UUID;
BEGIN
  -- 1. Obter IDs (Plano, Tema)
  SELECT id INTO v_free_plan_id FROM public.plans WHERE slug = 'free' LIMIT 1;
  SELECT id INTO v_free_theme_id FROM public.themes WHERE slug = 'free-classic' LIMIT 1;

  -- 2. Definir Nome
  IF v_user_full_name IS NOT NULL AND v_user_full_name != '' THEN
    v_company_name := 'Loja de ' || v_user_full_name;
  ELSE
    v_company_name := 'Minha Loja';
  END IF;

  -- 3. Gerar Slug
  LOOP
    v_attempt := v_attempt + 1;
    IF v_attempt = 1 THEN
      v_slug := LOWER(REPLACE(REGEXP_REPLACE(v_company_name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-'));
    ELSE
      v_slug := LOWER(REPLACE(REGEXP_REPLACE(v_company_name, '[^a-zA-Z0-9\s]', '', 'g'), ' ', '-')) || '-' || FLOOR(RANDOM() * 9999)::TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = v_slug) THEN EXIT; END IF;
    IF v_attempt >= v_max_attempts THEN
      v_slug := 'loja-' || EXTRACT(EPOCH FROM NOW())::BIGINT::TEXT;
      EXIT;
    END IF;
  END LOOP;

  -- 4. Criar Tenant
  INSERT INTO public.tenants (
    user_id, company_name, slug, email, whatsapp_number, primary_color,
    subscription_status, trial_ends_at, active
  )
  VALUES (
    NEW.id, v_company_name, v_slug, NEW.email, NULL, v_default_primary_color,
    'trial', NOW() + INTERVAL '7 days', TRUE
  )
  RETURNING id INTO v_tenant_id;

  -- 5. Criar Membership
  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (v_tenant_id, NEW.id, 2); -- Role 2 = Owner

  -- 6. Criar Subscription
  IF v_free_plan_id IS NOT NULL THEN
    INSERT INTO public.subscriptions (tenant_id, plan_id, status, trial_ends_at)
    VALUES (v_tenant_id, v_free_plan_id, 'active', NULL);
  END IF;

  -- 7. Criar Settings (SEM DADOS DEMO)
  INSERT INTO public.store_settings (tenant_id, branding, storefront, contact, theme_id)
  VALUES (
    v_tenant_id,
    jsonb_build_object('store_title', v_company_name, 'primary_color', v_default_primary_color, 'logo_url', '', 'favicon_url', ''),
    jsonb_build_object('product_card_style', 'classic', 'listing_columns', 3, 'banner_style', 'carousel', 'button_shape', 'rounded', 'button_size', 'medium', 'button_variant', 'filled', 'button_animation', 'shadow', 'show_whatsapp_button', true, 'navbar_style', 'fixed', 'footer_text', '© ' || EXTRACT(YEAR FROM NOW()) || ' ' || v_company_name || '. Todos os direitos reservados.', 'footer_background', '#0f172a', 'footer_text_color', '#f8fafc', 'social', '{}'::jsonb),
    jsonb_build_object('email', NEW.email, 'whatsapp_number', NULL),
    v_free_theme_id
  );

  -- [REMOVIDO] Seed de dados demo: Não insere mais produtos, categorias ou banners.

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao criar tenant para usuário %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

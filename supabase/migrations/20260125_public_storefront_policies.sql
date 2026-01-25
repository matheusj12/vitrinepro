-- ============================================
-- ADICIONAR POLÍTICA PÚBLICA PARA TENANTS ATIVOS
-- Permite que a vitrine pública seja acessada sem login
-- ============================================

-- Política para leitura pública de tenants ativos (para vitrine)
DROP POLICY IF EXISTS "Anyone can view active tenants" ON public.tenants;
CREATE POLICY "Anyone can view active tenants"
  ON public.tenants FOR SELECT
  USING (active = true);

-- Política para leitura pública de store_settings (para vitrine)
DROP POLICY IF EXISTS "Anyone can view store settings for active tenants" ON public.store_settings;
CREATE POLICY "Anyone can view store settings for active tenants"
  ON public.store_settings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = store_settings.tenant_id AND active = true
  ));

-- Política para leitura pública de banners de tenants ativos
DROP POLICY IF EXISTS "Anyone can view active banners" ON public.banners;
CREATE POLICY "Anyone can view active banners"
  ON public.banners FOR SELECT
  USING (active = true AND EXISTS (
    SELECT 1 FROM public.tenants
    WHERE id = banners.tenant_id AND tenants.active = true
  ));

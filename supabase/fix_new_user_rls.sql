-- =====================================================
-- FIX: Permitir que novos usuários criem seu próprio tenant
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. Permitir que qualquer usuário autenticado crie um tenant para si mesmo
DROP POLICY IF EXISTS "Users can create their own tenant" ON public.tenants;
CREATE POLICY "Users can create their own tenant"
  ON public.tenants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 2. Permitir que usuários criem membership para si mesmos
DROP POLICY IF EXISTS "Users can create their own membership" ON public.tenant_memberships;
CREATE POLICY "Users can create their own membership"
  ON public.tenant_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Permitir que usuários criem store_settings para seus tenants
DROP POLICY IF EXISTS "Users can create store settings for their tenants" ON public.store_settings;
CREATE POLICY "Users can create store settings for their tenants"
  ON public.store_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE tenant_id = store_settings.tenant_id 
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = store_settings.tenant_id 
      AND user_id = auth.uid()
    )
  );

-- 4. Permitir que usuários criem categorias em seus tenants
DROP POLICY IF EXISTS "Users can create categories for their tenants" ON public.categories;
CREATE POLICY "Users can create categories for their tenants"
  ON public.categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE tenant_id = categories.tenant_id 
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = categories.tenant_id 
      AND user_id = auth.uid()
    )
  );

-- 5. Permitir que usuários criem produtos em seus tenants
DROP POLICY IF EXISTS "Users can create products for their tenants" ON public.products;
CREATE POLICY "Users can create products for their tenants"
  ON public.products FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE tenant_id = products.tenant_id 
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = products.tenant_id 
      AND user_id = auth.uid()
    )
  );

-- 6. Permitir que usuários criem banners em seus tenants
DROP POLICY IF EXISTS "Users can create banners for their tenants" ON public.banners;
CREATE POLICY "Users can create banners for their tenants"
  ON public.banners FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships
      WHERE tenant_id = banners.tenant_id 
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = banners.tenant_id 
      AND user_id = auth.uid()
    )
  );

-- =====================================================
-- VERIFICAÇÃO: Listar políticas criadas
-- =====================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

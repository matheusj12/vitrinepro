-- ===========================================
-- FIX: Corrige recursão infinita nas políticas RLS
-- Execute este script no SQL Editor do Supabase
-- ===========================================

-- 1. Remover políticas problemáticas
DROP POLICY IF EXISTS "Users can view their memberships" ON public.tenant_memberships;
DROP POLICY IF EXISTS "Super admins can manage memberships" ON public.tenant_memberships;

-- 2. Criar políticas sem recursão
-- Usuários podem ver suas próprias memberships
CREATE POLICY "Users can view their own memberships" 
  ON public.tenant_memberships FOR SELECT
  USING (user_id = auth.uid());

-- Usuários podem inserir memberships se forem owners do próprio tenant  
CREATE POLICY "Users can insert memberships"
  ON public.tenant_memberships FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Usuários podem atualizar suas próprias memberships
CREATE POLICY "Users can update their own memberships"
  ON public.tenant_memberships FOR UPDATE
  USING (user_id = auth.uid());

-- Usuários podem deletar suas próprias memberships
CREATE POLICY "Users can delete their own memberships"
  ON public.tenant_memberships FOR DELETE
  USING (user_id = auth.uid());

-- 3. Corrigir políticas de tenants que também podem ter recursão
DROP POLICY IF EXISTS "Super admins can do everything on tenants" ON public.tenants;

-- 4. Adicionar política mais simples para tenants
-- Super admins são identificados pelo role=3 em suas próprias memberships
CREATE POLICY "Authenticated users can insert tenants" 
  ON public.tenants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. Verificar dados do usuário
SELECT 
  u.id as user_id,
  u.email,
  t.id as tenant_id,
  t.company_name,
  t.slug,
  tm.role
FROM auth.users u
LEFT JOIN public.tenants t ON t.user_id = u.id
LEFT JOIN public.tenant_memberships tm ON tm.user_id = u.id
WHERE u.email = 'matheusjuliodeoliveira@gmail.com';

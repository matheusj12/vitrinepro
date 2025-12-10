-- Correções críticas de segurança identificadas na auditoria

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
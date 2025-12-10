-- Criar bucket para logos
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
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id) WHERE category_id IS NOT NULL;
-- PROMPT 1: Melhorias no módulo de produtos

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
  EXECUTE FUNCTION public.update_product_variations_updated_at();
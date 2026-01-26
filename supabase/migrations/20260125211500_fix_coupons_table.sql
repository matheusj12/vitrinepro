
-- Criação da tabela de cupons (Fix para tabela ausente)
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  code TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage', 'fixed'
  value DECIMAL(10, 2) NOT NULL,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  max_discount DECIMAL(10, 2), -- limite máximo de desconto
  max_uses INTEGER, -- null = ilimitado
  used_count INTEGER DEFAULT 0,
  usage_per_customer INTEGER DEFAULT 1,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  applies_to TEXT DEFAULT 'all', -- 'all', 'categories', 'products'
  applies_to_ids UUID[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, code)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_coupons_tenant ON public.coupons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(tenant_id, code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(tenant_id, active);

-- RLS (Permissões de Segurança)
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Política: Donos da loja podem fazer tudo (criar, editar, deletar)
DROP POLICY IF EXISTS "Owners can manage coupons" ON public.coupons;
CREATE POLICY "Owners can manage coupons"
  ON public.coupons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = coupons.tenant_id AND user_id = auth.uid()
  ));

-- Política: Qualquer um (clientes) pode VER cupons ativos para validar no carrinho
DROP POLICY IF EXISTS "Anyone can validate coupons" ON public.coupons;
CREATE POLICY "Anyone can validate coupons"
  ON public.coupons FOR SELECT
  USING (active = TRUE);

-- Trigger para atualizar o updated_at automaticamente
DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

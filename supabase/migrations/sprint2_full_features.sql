-- =====================================================
-- VITRINEPRO - SPRINT 2: NOVAS FEATURES
-- Variações, Estoque, Cupons, Clientes, Pedidos
-- =====================================================

-- =====================================================
-- 1. MELHORAR TABELA DE PRODUTOS (ESTOQUE)
-- =====================================================

-- Adicionar campos de estoque se não existirem
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS stock_control_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS low_stock_alert INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS compare_at_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS weight DECIMAL(10, 3),
ADD COLUMN IF NOT EXISTS dimensions JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- =====================================================
-- 2. TABELA DE VARIAÇÕES DE PRODUTO
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_variations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- "Tamanho", "Cor", "Material"
  value TEXT NOT NULL, -- "P", "M", "G" ou "Azul", "Vermelho"
  price_adjustment DECIMAL(10, 2) DEFAULT 0, -- +10, -5, etc
  stock_quantity INTEGER DEFAULT 0,
  sku_suffix TEXT, -- "-P", "-AZUL"
  image_url TEXT, -- Imagem específica da variação
  active BOOLEAN DEFAULT TRUE,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_variations_product ON public.product_variations(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variations_active ON public.product_variations(product_id, active);

-- RLS
ALTER TABLE public.product_variations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active variations" ON public.product_variations;
CREATE POLICY "Anyone can view active variations"
  ON public.product_variations FOR SELECT
  USING (active = TRUE OR EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.tenant_memberships tm ON tm.tenant_id = p.tenant_id
    WHERE p.id = product_variations.product_id AND tm.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Owners can manage variations" ON public.product_variations;
CREATE POLICY "Owners can manage variations"
  ON public.product_variations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.tenant_memberships tm ON tm.tenant_id = p.tenant_id
    WHERE p.id = product_variations.product_id AND tm.user_id = auth.uid()
  ));

-- =====================================================
-- 3. TABELA DE MÚLTIPLAS IMAGENS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  alt_text TEXT,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_position ON public.product_images(product_id, position);

-- RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;
CREATE POLICY "Anyone can view product images"
  ON public.product_images FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Owners can manage product images" ON public.product_images;
CREATE POLICY "Owners can manage product images"
  ON public.product_images FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.tenant_memberships tm ON tm.tenant_id = p.tenant_id
    WHERE p.id = product_images.product_id AND tm.user_id = auth.uid()
  ));

-- =====================================================
-- 4. TABELA DE CLIENTES/LEADS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  document TEXT, -- CPF/CNPJ
  address JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  source TEXT DEFAULT 'manual', -- 'manual', 'whatsapp', 'website', 'instagram', 'quote'
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10, 2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON public.customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON public.customers(tenant_id, whatsapp);
CREATE INDEX IF NOT EXISTS idx_customers_source ON public.customers(tenant_id, source);

-- RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view their customers" ON public.customers;
CREATE POLICY "Owners can view their customers"
  ON public.customers FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = customers.tenant_id AND user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Owners can manage customers" ON public.customers;
CREATE POLICY "Owners can manage customers"
  ON public.customers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = customers.tenant_id AND user_id = auth.uid()
  ));

-- Permitir inserção via website/orçamento
DROP POLICY IF EXISTS "Anyone can create customers" ON public.customers;
CREATE POLICY "Anyone can create customers"
  ON public.customers FOR INSERT
  WITH CHECK (TRUE);

-- =====================================================
-- 5. TABELA DE CUPONS DE DESCONTO
-- =====================================================

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

-- RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage coupons" ON public.coupons;
CREATE POLICY "Owners can manage coupons"
  ON public.coupons FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = coupons.tenant_id AND user_id = auth.uid()
  ));

-- Permitir validação de cupom pelo cliente
DROP POLICY IF EXISTS "Anyone can validate coupons" ON public.coupons;
CREATE POLICY "Anyone can validate coupons"
  ON public.coupons FOR SELECT
  USING (active = TRUE);

-- =====================================================
-- 6. TABELA DE PEDIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  order_number SERIAL,
  
  -- Itens do pedido
  items JSONB NOT NULL DEFAULT '[]',
  
  -- Valores
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
  coupon_code TEXT,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Pagamento
  payment_method TEXT, -- 'pix', 'card', 'boleto', 'cash', 'transfer'
  payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
  payment_id TEXT, -- ID externo (Stripe, Mercado Pago)
  paid_at TIMESTAMPTZ,
  
  -- Entrega
  shipping_method TEXT, -- 'pickup', 'delivery', 'correios', 'motoboy'
  shipping_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  shipping_address JSONB DEFAULT '{}',
  tracking_code TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Dados do cliente (desnormalizados para histórico)
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_whatsapp TEXT,
  
  -- Meta
  notes TEXT,
  internal_notes TEXT, -- notas internas do lojista
  source TEXT DEFAULT 'website', -- 'website', 'whatsapp', 'pdv', 'instagram'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON public.orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(tenant_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_shipping ON public.orders(tenant_id, shipping_status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(tenant_id, created_at DESC);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage orders" ON public.orders;
CREATE POLICY "Owners can manage orders"
  ON public.orders FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = orders.tenant_id AND user_id = auth.uid()
  ));

-- Permitir criação de pedido pelo cliente
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (TRUE);

-- =====================================================
-- 7. TABELA DE CONVERSAS WHATSAPP
-- =====================================================

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  name TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'waiting', 'closed', 'archived'
  channel TEXT DEFAULT 'whatsapp', -- 'whatsapp', 'instagram', 'email'
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  ai_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON public.conversations(tenant_id, phone);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(tenant_id, last_message_at DESC);

-- RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage conversations" ON public.conversations;
CREATE POLICY "Owners can manage conversations"
  ON public.conversations FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE tenant_id = conversations.tenant_id AND user_id = auth.uid()
  ));

-- =====================================================
-- 8. TABELA DE MENSAGENS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  content TEXT,
  media_url TEXT,
  media_type TEXT, -- 'image', 'video', 'audio', 'document'
  
  -- IA
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_intent TEXT, -- 'purchase', 'question', 'support', 'greeting', 'complaint'
  ai_sentiment TEXT, -- 'positive', 'negative', 'neutral'
  ai_response TEXT, -- resposta sugerida pela IA
  
  -- Status
  status TEXT DEFAULT 'sent', -- 'pending', 'sent', 'delivered', 'read', 'failed'
  external_id TEXT, -- ID da mensagem no WhatsApp
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(conversation_id, created_at DESC);

-- RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage messages" ON public.messages;
CREATE POLICY "Owners can manage messages"
  ON public.messages FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.tenant_memberships tm ON tm.tenant_id = c.tenant_id
    WHERE c.id = messages.conversation_id AND tm.user_id = auth.uid()
  ));

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Aplicar trigger nas novas tabelas
DROP TRIGGER IF EXISTS update_product_variations_updated_at ON public.product_variations;
CREATE TRIGGER update_product_variations_updated_at
  BEFORE UPDATE ON public.product_variations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_coupons_updated_at ON public.coupons;
CREATE TRIGGER update_coupons_updated_at
  BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 10. FUNÇÃO PARA VALIDAR CUPOM
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_tenant_id UUID,
  p_code TEXT,
  p_cart_total DECIMAL
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_discount DECIMAL;
  v_result JSONB;
BEGIN
  -- Buscar cupom
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE tenant_id = p_tenant_id
    AND UPPER(code) = UPPER(p_code)
    AND active = TRUE
    AND (valid_from IS NULL OR valid_from <= NOW())
    AND (valid_until IS NULL OR valid_until >= NOW())
    AND (max_uses IS NULL OR used_count < max_uses);
  
  -- Cupom não encontrado
  IF v_coupon IS NULL THEN
    RETURN jsonb_build_object('valid', FALSE, 'error', 'Cupom inválido ou expirado');
  END IF;
  
  -- Verificar valor mínimo
  IF p_cart_total < v_coupon.min_purchase THEN
    RETURN jsonb_build_object(
      'valid', FALSE, 
      'error', 'Valor mínimo de R$ ' || v_coupon.min_purchase || ' não atingido'
    );
  END IF;
  
  -- Calcular desconto
  IF v_coupon.type = 'percentage' THEN
    v_discount := p_cart_total * (v_coupon.value / 100);
  ELSE
    v_discount := v_coupon.value;
  END IF;
  
  -- Aplicar limite máximo
  IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
    v_discount := v_coupon.max_discount;
  END IF;
  
  -- Não pode ser maior que o total
  IF v_discount > p_cart_total THEN
    v_discount := p_cart_total;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', TRUE,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'type', v_coupon.type,
    'value', v_coupon.value,
    'discount', v_discount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

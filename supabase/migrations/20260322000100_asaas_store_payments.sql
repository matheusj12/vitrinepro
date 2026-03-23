-- ================================================================
-- Asaas Store Payments
-- Adiciona colunas de pagamento Asaas na tabela orders
-- para rastrear cobranças PIX/boleto geradas pela plataforma
-- ================================================================

-- Colunas Asaas na tabela orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS asaas_payment_id       TEXT,
  ADD COLUMN IF NOT EXISTS asaas_pix_qr_code      TEXT,        -- copia-e-cola PIX
  ADD COLUMN IF NOT EXISTS asaas_pix_qr_code_url  TEXT,        -- imagem base64 do QR code
  ADD COLUMN IF NOT EXISTS asaas_boleto_url        TEXT,        -- link do boleto PDF
  ADD COLUMN IF NOT EXISTS asaas_boleto_code       TEXT,        -- linha digitável do boleto
  ADD COLUMN IF NOT EXISTS asaas_invoice_url       TEXT,        -- link da fatura Asaas
  ADD COLUMN IF NOT EXISTS payment_due_date        TIMESTAMPTZ; -- expiração do PIX / boleto

-- Índice para webhook buscar order pelo payment_id
CREATE INDEX IF NOT EXISTS idx_orders_asaas_payment_id
  ON public.orders(asaas_payment_id)
  WHERE asaas_payment_id IS NOT NULL;

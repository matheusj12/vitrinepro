-- Migration: Add payment column to system_settings
-- This stores Mercado Pago and Asaas API credentials

ALTER TABLE public.system_settings
ADD COLUMN IF NOT EXISTS payment JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.system_settings.payment IS 'Payment gateway settings (Mercado Pago, Asaas)';

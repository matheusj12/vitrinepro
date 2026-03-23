-- ================================================================
-- Cria tabela system_settings (configurações globais da plataforma)
-- Inclui payment (gateways), social (ícones de redes sociais)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.system_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment     JSONB NOT NULL DEFAULT '{}'::jsonb,
  social      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Apenas superadmins (role = 3) podem ler e escrever
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_all" ON public.system_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tenant_memberships tm
      WHERE tm.user_id = auth.uid()
        AND tm.role = 3
    )
  );

-- Edge Functions (service role) têm acesso irrestrito via service key

-- Seed: garante que sempre existe exatamente 1 linha
INSERT INTO public.system_settings (payment, social)
SELECT '{}'::jsonb, '{}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.system_settings);

COMMENT ON TABLE public.system_settings IS
  'Configurações globais da plataforma VitrinePro (superadmin only)';
COMMENT ON COLUMN public.system_settings.payment IS
  'Gateways de pagamento: { asaas_api_key, asaas_enabled, asaas_sandbox, asaas_webhook_token, mercadopago_access_token, ... }';
COMMENT ON COLUMN public.system_settings.social IS
  'Ícones de redes sociais: { icons: { instagram, facebook, ... } }';

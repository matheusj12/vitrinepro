-- =====================================================
-- VITRINEPRO - CUPONS DE ASSINATURA
-- Cupons de desconto para planos (PIX only)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscription_coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    discount_value NUMERIC(10,2) NOT NULL,
    pix_only BOOLEAN DEFAULT true,
    max_uses INTEGER DEFAULT NULL,
    current_uses INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscription_coupons ENABLE ROW LEVEL SECURITY;

-- Superadmin gerencia tudo
CREATE POLICY "superadmin_manage_coupons" ON public.subscription_coupons
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.tenant_memberships WHERE user_id = auth.uid() AND role = 3)
    );

-- Qualquer usuário autenticado pode ler cupons ativos (para validar no checkout)
CREATE POLICY "authenticated_read_active_coupons" ON public.subscription_coupons
    FOR SELECT USING (active = true AND auth.role() = 'authenticated');

-- Inserir cupons iniciais de exemplo
INSERT INTO public.subscription_coupons (code, description, discount_type, discount_value, pix_only, max_uses, expires_at)
VALUES
    ('BEMVINDO50', 'Bem-vindo! 50% de desconto no primeiro mês', 'percent', 50, true, 100, NOW() + INTERVAL '90 days'),
    ('PRO30DIAS', '30 dias com desconto especial no plano PRO', 'percent', 30, true, 50, NOW() + INTERVAL '60 days');

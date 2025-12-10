-- Tabela para controlar notificações de email enviadas
CREATE TABLE IF NOT EXISTS public.email_notifications_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  days_before_expiry INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  CONSTRAINT unique_notification UNIQUE (tenant_id, notification_type, days_before_expiry, expiry_date)
);

-- Index para consultas rápidas
CREATE INDEX idx_email_notifications_tenant ON public.email_notifications_sent(tenant_id);
CREATE INDEX idx_email_notifications_sent_at ON public.email_notifications_sent(sent_at);
CREATE INDEX idx_email_notifications_type ON public.email_notifications_sent(notification_type);

-- RLS policies
ALTER TABLE public.email_notifications_sent ENABLE ROW LEVEL SECURITY;

-- Super admins podem ver todos os emails enviados
CREATE POLICY "Super admins can view all email notifications"
ON public.email_notifications_sent
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.tenant_memberships
    WHERE user_id = auth.uid() AND role = 3
  )
);

-- Sistema pode inserir notificações
CREATE POLICY "System can insert email notifications"
ON public.email_notifications_sent
FOR INSERT
WITH CHECK (true);

COMMENT ON TABLE public.email_notifications_sent IS 'Registra emails de notificação enviados para evitar duplicatas';
COMMENT ON COLUMN public.email_notifications_sent.notification_type IS 'Tipo: expiry_warning_7, expiry_warning_3, expiry_warning_1, expired';
COMMENT ON COLUMN public.email_notifications_sent.days_before_expiry IS 'Quantos dias antes da expiração o email foi enviado';
COMMENT ON COLUMN public.email_notifications_sent.expiry_date IS 'Data de expiração do tenant no momento do envio';
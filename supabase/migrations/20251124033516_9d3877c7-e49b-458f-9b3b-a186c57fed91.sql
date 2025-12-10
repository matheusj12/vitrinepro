-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Criar cron job para verificar expirações diariamente às 10h UTC (7h BRT)
SELECT cron.schedule(
  'check-expiring-subscriptions-daily',
  '0 10 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://rtljfxgxpgzabbsmqwno.supabase.co/functions/v1/check-expiring-subscriptions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bGpmeGd4cGd6YWJic21xd25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzI4MDMsImV4cCI6MjA3NjY0ODgwM30.4OIrYaOYZ-FQ0sRgUIdJNIK6o5F-W6mAAG-iUmCcZGw"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

COMMENT ON EXTENSION pg_cron IS 'Extensão para agendar jobs recorrentes no PostgreSQL';
COMMENT ON EXTENSION pg_net IS 'Extensão para fazer requisições HTTP do PostgreSQL';
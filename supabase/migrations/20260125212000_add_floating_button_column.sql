
-- Adiciona coluna para ícone do botão flutuante se não existir
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS floating_button_icon_url TEXT;

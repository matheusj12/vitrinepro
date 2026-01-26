
-- Adiciona suporte a URLs de vídeo nos produtos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;

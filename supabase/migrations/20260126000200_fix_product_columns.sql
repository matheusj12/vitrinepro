
-- Adiciona colunas para suporte a vídeo e múltiplas imagens em stores existentes
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::TEXT[];

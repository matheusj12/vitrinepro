
-- -----------------------------------------------------------------------------
-- CORREÇÃO COMPLETA DE COLUNAS DE PRODUTOS
-- -----------------------------------------------------------------------------
-- Copie este código e execute no SQL Editor do Supabase.
-- Ele adiciona as colunas 'video_url' e 'images' que estão faltando na tabela products.
-- E evita o erro 400 ao salvar.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}'::TEXT[];

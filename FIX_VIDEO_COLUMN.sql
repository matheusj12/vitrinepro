
-- -----------------------------------------------------------------------------
-- CORREÇÃO PARA ERRO AO CRIAR PRODUTO (video_url)
-- -----------------------------------------------------------------------------
-- Copie este código e execute no SQL Editor do Supabase.
-- Ele adiciona a coluna 'video_url' que estava faltando na tabela de produtos.

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;


-- Adiciona a columa 'images' (array de text) à tabela de produtos
-- para suportar múltiplas imagens por produto.

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Migrar image_url existente para o array images se estiver vazio
UPDATE public.products
SET images = ARRAY[image_url]
WHERE (images IS NULL OR array_length(images, 1) IS NULL) AND image_url IS NOT NULL;

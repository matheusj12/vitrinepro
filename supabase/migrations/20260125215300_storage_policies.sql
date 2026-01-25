-- Políticas de Storage para o bucket 'images'

-- Política: Qualquer pessoa pode ver imagens públicas
CREATE POLICY "Public images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Política: Usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Política: Usuários autenticados podem atualizar suas imagens
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Política: Usuários autenticados podem deletar suas imagens
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
);

-- Políticas para o bucket 'store-logos'
CREATE POLICY "Public logos are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'store-logos');

CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'store-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'store-logos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'store-logos' 
  AND auth.role() = 'authenticated'
);

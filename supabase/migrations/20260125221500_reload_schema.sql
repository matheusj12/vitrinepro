
-- Força o reload do cache de schema do PostgREST
-- Isso é necessário para que a API reconheça a nova coluna 'images' imediatamente
NOTIFY pgrst, 'reload schema';

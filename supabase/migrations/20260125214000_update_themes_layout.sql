
-- Atualiza layout dos temas para demonstrar variação estrutural

-- Nature Zen -> Minimal
UPDATE public.themes
SET config = jsonb_set(config, '{layout}', '"minimal"')
WHERE slug = 'nature-zen';

-- Ocean Breeze -> Minimal
UPDATE public.themes
SET config = jsonb_set(config, '{layout}', '"minimal"')
WHERE slug = 'ocean-breeze';

-- Cyberpunk Neon -> Minimal (mas com bordas neon, vai ficar legal limpo)
UPDATE public.themes
SET config = jsonb_set(config, '{layout}', '"minimal"')
WHERE slug = 'cyberpunk-neon';

-- Midnight Luxury -> Default (requer mais estrutura)
UPDATE public.themes
SET config = jsonb_set(config, '{layout}', '"default"')
WHERE slug = 'midnight-luxury';

-- Free Classic (Padrão) -> Default
UPDATE public.themes
SET config = jsonb_set(config, '{layout}', '"default"')
WHERE slug = 'free-classic';

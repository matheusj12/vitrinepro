-- Atualizar ou inserir os 3 temas gratuitos
INSERT INTO public.themes (slug, name, type, description, is_premium, active, thumbnail_url, colors, config)
VALUES
  (
    'free-classic',
    'Free Classic',
    'free',
    'Tema clássico e limpo para sua loja',
    false,
    true,
    '/images/themes/classic-white.png',
    '{"--primary": "25 95% 53%", "--background": "0 0% 100%", "--foreground": "222 47% 11%", "--card": "0 0% 100%", "--card-foreground": "222 47% 11%"}',
    '{"layout": "classic", "grid_columns": 3}'
  ),
  (
    'dark-modern',
    'Dark Modern',
    'free',
    'Tema escuro e moderno',
    false,
    true,
    '/images/themes/dark-modern.png',
    '{"--primary": "25 95% 53%", "--background": "222 47% 11%", "--foreground": "210 40% 98%", "--card": "217 33% 17%", "--card-foreground": "210 40% 98%"}',
    '{"layout": "modern", "grid_columns": 3}'
  ),
  (
    'candy-soft',
    'Candy Soft',
    'free',
    'Tema suave com cores pastéis',
    false,
    true,
    '/images/themes/candy-soft.png',
    '{"--primary": "330 90% 70%", "--background": "330 100% 98%", "--foreground": "330 40% 20%", "--card": "330 100% 95%", "--card-foreground": "330 40% 20%"}',
    '{"layout": "soft", "grid_columns": 3}'
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_premium = EXCLUDED.is_premium,
  active = EXCLUDED.active,
  thumbnail_url = EXCLUDED.thumbnail_url,
  colors = EXCLUDED.colors,
  config = EXCLUDED.config,
  updated_at = now();
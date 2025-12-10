-- Atualizar cores dos temas Essencial Clean e Pro Premium para usar CSS variables corretas

UPDATE themes
SET colors = jsonb_build_object(
  '--background', '240 10% 98%',
  '--foreground', '240 10% 10%',
  '--primary', '25 95% 53%',
  '--card', '240 10% 95%',
  '--card-foreground', '240 10% 10%'
)
WHERE slug = 'essencial-clean';

UPDATE themes
SET colors = jsonb_build_object(
  '--background', '270 50% 5%',
  '--foreground', '270 20% 95%',
  '--primary', '280 90% 65%',
  '--card', '270 40% 10%',
  '--card-foreground', '270 20% 95%'
)
WHERE slug = 'pro-premium';
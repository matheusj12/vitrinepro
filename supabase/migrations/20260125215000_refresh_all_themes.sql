
-- ATUALIZAÇÃO MASSIVA DE TEMAS (Visual + Layout)

-- 1. Essencial Clean (Minimalista, Branco, Flat)
UPDATE public.themes
SET config = '{
  "layout": "minimal",
  "colors": {
    "background": "0 0% 100%", "foreground": "0 0% 10%", 
    "primary": "0 0% 20%", "primary-foreground": "0 0% 100%",
    "card": "0 0% 98%", "border": "0 0% 90%",
    "accent": "0 0% 96%"
  },
  "productCard": { "radius": "0px", "shadow": "none", "border": "1px solid #e5e5e5" },
  "fonts": { "heading": "Inter", "body": "Inter" }
}'
WHERE slug = 'essencial-clean';

-- 2. Pro Premium (Clássico, Sofisticado, Azul Marinho)
UPDATE public.themes
SET config = '{
  "layout": "default",
  "colors": {
    "background": "220 10% 98%", "foreground": "220 20% 20%", 
    "primary": "220 50% 20%", "primary-foreground": "0 0% 100%",
    "card": "0 0% 100%", "border": "220 10% 90%",
    "accent": "220 30% 94%"
  },
  "productCard": { "radius": "4px", "shadow": "0 4px 6px -1px rgba(0,0,0,0.1)", "border": "none" },
  "fonts": { "heading": "Playfair Display", "body": "Lato" }
}'
WHERE slug = 'pro-premium';

-- 3. Free Classic (O padrão robusto)
UPDATE public.themes
SET config = '{
  "layout": "default",
  "colors": {
    "background": "0 0% 100%", "foreground": "222 47% 11%", 
    "primary": "221 83% 53%", "primary-foreground": "210 40% 98%",
    "card": "0 0% 100%", "border": "214 32% 91%",
    "accent": "210 40% 96.1%"
  },
  "productCard": { "radius": "8px", "shadow": "0 1px 3px rgba(0,0,0,0.1)", "border": "1px solid #e2e8f0" },
  "fonts": { "heading": "Roboto", "body": "Roboto" }
}'
WHERE slug = 'free-classic';

-- 4. Dark Modern (Escuro, Minimalista, Tech)
UPDATE public.themes
SET config = '{
  "layout": "minimal",
  "colors": {
    "background": "240 10% 4%", "foreground": "0 0% 98%", 
    "primary": "142 70% 50%", "primary-foreground": "144 65% 10%",
    "card": "240 10% 8%", "border": "240 5% 20%",
    "accent": "240 5% 15%"
  },
  "productCard": { "radius": "12px", "shadow": "none", "border": "1px solid #333" },
  "fonts": { "heading": "Orbitron", "body": "Inter" }
}'
WHERE slug = 'dark-modern';

-- 5. Candy Soft (Pastel, Lilás, Divertido)
UPDATE public.themes
SET config = '{
  "layout": "minimal",
  "colors": {
    "background": "300 20% 98%", "foreground": "280 40% 30%", 
    "primary": "320 80% 70%", "primary-foreground": "0 0% 100%",
    "card": "0 0% 100%", "border": "320 30% 90%",
    "accent": "300 40% 95%"
  },
  "productCard": { "radius": "24px", "shadow": "0 10px 20px -5px rgba(255,182,193,0.4)", "border": "2px solid #fff" },
  "fonts": { "heading": "Quicksand", "body": "Nunito" }
}'
WHERE slug = 'candy-soft';

-- 6. Midnight Luxury (Preto total, Ouro, Elite)
UPDATE public.themes
SET config = '{
  "layout": "default",
  "colors": {
    "background": "0 0% 5%", "foreground": "45 20% 90%", 
    "primary": "45 80% 50%", "primary-foreground": "0 0% 10%",
    "card": "0 0% 8%", "border": "45 30% 20%",
    "accent": "45 10% 15%"
  },
  "productCard": { "radius": "0px", "shadow": "0 20px 25px -5px rgba(0,0,0,0.7)", "border": "1px solid rgba(212,175,55,0.2)" },
  "fonts": { "heading": "Cinzel", "body": "Montserrat" }
}'
WHERE slug = 'midnight-luxury';

-- 7. Cyberpunk Neon (Roxo/Ciano, Gamer)
UPDATE public.themes
SET config = '{
  "layout": "minimal",
  "colors": {
    "background": "260 50% 8%", "foreground": "180 100% 90%", 
    "primary": "180 100% 50%", "primary-foreground": "260 50% 10%",
    "card": "260 40% 15%", "border": "300 100% 50%",
    "accent": "300 80% 20%"
  },
  "productCard": { "radius": "4px", "shadow": "0 0 15px rgba(0,255,255,0.2)", "border": "1px solid #00ffff" },
  "fonts": { "heading": "Orbitron", "body": "Rajdhani" }
}'
WHERE slug = 'cyberpunk-neon';

-- 8. Nature Zen (Sálvia, Bege, Orgânico)
UPDATE public.themes
SET config = '{
  "layout": "minimal",
  "colors": {
    "background": "40 30% 96%", "foreground": "120 20% 25%", 
    "primary": "120 30% 50%", "primary-foreground": "0 0% 100%",
    "card": "0 0% 100%", "border": "120 15% 85%",
    "accent": "40 40% 92%"
  },
  "productCard": { "radius": "16px", "shadow": "0 4px 6px -1px rgba(85,107,47,0.1)", "border": "none" },
  "fonts": { "heading": "Merriweather", "body": "Lato" }
}'
WHERE slug = 'nature-zen';

-- 9. Ocean Breeze (Azul, Fresco, Verão)
UPDATE public.themes
SET config = '{
  "layout": "default",
  "colors": {
    "background": "200 60% 98%", "foreground": "210 40% 20%", 
    "primary": "210 90% 50%", "primary-foreground": "0 0% 100%",
    "card": "0 0% 100%", "border": "210 30% 90%",
    "accent": "200 50% 94%"
  },
  "productCard": { "radius": "12px", "shadow": "0 10px 15px -3px rgba(59,130,246,0.15)", "border": "1px solid rgba(59,130,246,0.1)" },
  "fonts": { "heading": "Poppins", "body": "Open Sans" }
}'
WHERE slug = 'ocean-breeze';

-- 10. Sunset Vibes (Gradiente, Quente)
UPDATE public.themes
SET config = '{
  "layout": "minimal",
  "colors": {
    "background": "20 50% 98%", "foreground": "270 40% 20%", 
    "primary": "10 90% 60%", "primary-foreground": "0 0% 100%",
    "card": "0 0% 100%", "border": "10 30% 90%",
    "accent": "340 50% 96%"
  },
  "productCard": { "radius": "20px", "shadow": "0 15px 30px -10px rgba(255,107,107,0.3)", "border": "none" },
  "fonts": { "heading": "Outfit", "body": "DM Sans" }
}'
WHERE slug = 'sunset-vibes';

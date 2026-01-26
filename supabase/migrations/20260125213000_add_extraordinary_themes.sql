
-- Adiciona novos temas "extraordinários"

-- 1. Midnight Luxury (Preto, Dourado, Premium)
INSERT INTO public.themes (id, name, slug, type, config, active)
VALUES (
  gen_random_uuid(),
  'Midnight Luxury',
  'midnight-luxury',
  'free', -- Oferecer como free para impressionar, ou pro se quiser monetizar
  '{
    "colors": {
      "background": "240 10% 3.9%", 
      "foreground": "0 0% 98%", 
      "primary": "45 93% 47%", 
      "primary-foreground": "0 0% 9%", 
      "card": "240 10% 5%", 
      "card-foreground": "0 0% 98%", 
      "border": "240 3.7% 15.9%",
      "accent": "45 93% 47%",
      "accent-foreground": "0 0% 9%",
      "secondary": "240 3.7% 15.9%",
      "secondary-foreground": "0 0% 98%"
    },
    "productCard": {
      "radius": "0px",
      "shadow": "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
      "border": "1px solid rgba(234, 179, 8, 0.2)",
      "hoverScale": 1.05
    },
    "header": {
      "style": "transparent",
      "blur": true
    },
    "fonts": {
      "heading": "Playfair Display",
      "body": "Inter"
    }
  }',
  true
);

-- 2. Cyberpunk Neon (Roxo Escuro, Ciano, Moderno)
INSERT INTO public.themes (id, name, slug, type, config, active)
VALUES (
  gen_random_uuid(),
  'Cyberpunk Neon',
  'cyberpunk-neon',
  'free',
  '{
    "colors": {
      "background": "260 50% 10%", 
      "foreground": "0 0% 100%", 
      "primary": "180 100% 50%", 
      "primary-foreground": "260 50% 10%", 
      "card": "260 50% 15%", 
      "card-foreground": "0 0% 100%", 
      "border": "300 100% 50%",
      "accent": "300 100% 50%",
      "accent-foreground": "0 0% 100%",
      "ring": "180 100% 50%"
    },
    "productCard": {
      "radius": "0.75rem",
      "shadow": "0 0 15px rgba(0, 255, 255, 0.3)",
      "border": "1px solid rgba(255, 0, 255, 0.5)",
      "hoverGlow": true
    },
    "fonts": {
      "heading": "Orbitron",
      "body": "Rajdhani"
    }
  }',
  true
);

-- 3. Nature Zen (Sálvia, Bege, Orgânico)
INSERT INTO public.themes (id, name, slug, type, config, active)
VALUES (
  gen_random_uuid(),
  'Nature Zen',
  'nature-zen',
  'free',
  '{
    "colors": {
      "background": "40 20% 97%", 
      "foreground": "120 10% 20%", 
      "primary": "140 30% 40%", 
      "primary-foreground": "0 0% 100%", 
      "card": "0 0% 100%", 
      "card-foreground": "120 10% 20%", 
      "border": "140 20% 80%",
      "accent": "40 30% 90%",
      "accent-foreground": "120 10% 20%",
      "secondary": "140 15% 90%",
      "secondary-foreground": "120 10% 30%"
    },
    "productCard": {
      "radius": "1.5rem",
      "shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      "border": "none"
    },
    "fonts": {
      "heading": "Outfit",
      "body": "Nunito"
    }
  }',
  true
);

-- 4. Ocean Breeze (Azul, Branco, Fresco)
INSERT INTO public.themes (id, name, slug, type, config, active)
VALUES (
  gen_random_uuid(),
  'Ocean Breeze',
  'ocean-breeze',
  'free',
  '{
    "colors": {
      "background": "200 50% 98%", 
      "foreground": "220 40% 20%", 
      "primary": "210 100% 50%", 
      "primary-foreground": "0 0% 100%", 
      "card": "0 0% 100%", 
      "card-foreground": "220 40% 20%", 
      "border": "210 30% 90%",
      "accent": "190 60% 95%",
      "accent-foreground": "220 40% 20%"
    },
    "productCard": {
      "radius": "1rem",
      "shadow": "0 10px 25px -5px rgba(59, 130, 246, 0.15)",
      "border": "1px solid rgba(59, 130, 246, 0.1)"
    },
    "fonts": {
      "heading": "Montserrat",
      "body": "Lato"
    }
  }',
  true
);

-- 5. Sunset Vibes (Gradiente, Laranja, Violeta, Vibrante) by VitrinePro
INSERT INTO public.themes (id, name, slug, type, config, active)
VALUES (
  gen_random_uuid(),
  'Sunset Vibes',
  'sunset-vibes',
  'free',
  '{
    "colors": {
      "background": "280 50% 98%", 
      "foreground": "280 60% 10%", 
      "primary": "10 90% 60%", 
      "primary-foreground": "0 0% 100%", 
      "card": "0 0% 100%", 
      "card-foreground": "280 60% 15%", 
      "border": "280 20% 90%",
      "accent": "260 80% 96%",
      "accent-foreground": "280 60% 20%",
      "gradient": "linear-gradient(135deg, #FF6B6B 0%, #845EC2 100%)"
    },
    "productCard": {
      "radius": "1.25rem",
      "shadow": "0 10px 30px -10px rgba(132, 94, 194, 0.25)",
      "border": "none"
    },
    "fonts": {
      "heading": "Poppins",
      "body": "Mulish"
    }
  }',
  true
);

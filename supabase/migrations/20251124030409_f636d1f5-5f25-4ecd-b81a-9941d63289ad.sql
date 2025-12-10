-- Tornar todos os temas gratuitos por enquanto
UPDATE public.themes 
SET is_premium = false 
WHERE slug IN ('essencial-clean', 'pro-premium');
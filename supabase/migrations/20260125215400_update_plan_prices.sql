-- Atualizar preços dos planos para valores mais atrativos

-- Essencial: de R$ 49,90 para R$ 29,90
UPDATE public.plans 
SET 
  price_cents = 2990,
  description = 'Perfeito para começar seu negócio online',
  features = '[
    "Até 50 produtos",
    "3 banners personalizáveis",
    "Catálogo completo",
    "WhatsApp integrado",
    "1 usuário",
    "Suporte por email"
  ]'::jsonb,
  updated_at = NOW()
WHERE slug = 'essencial';

-- Pro: de R$ 129 para R$ 59,90
UPDATE public.plans 
SET 
  price_cents = 5990,
  description = 'Tudo que você precisa para crescer',
  features = '[
    "Produtos ilimitados",
    "Banners ilimitados",
    "Temas premium",
    "Analytics avançado",
    "Remoção da marca VitrinePro",
    "Domínio personalizado",
    "Suporte prioritário",
    "Múltiplos usuários"
  ]'::jsonb,
  updated_at = NOW()
WHERE slug = 'pro';

-- Grátis: melhorar features
UPDATE public.plans 
SET 
  description = 'Comece agora, sem pagar nada',
  features = '[
    "Até 10 produtos",
    "1 banner",
    "Catálogo básico",
    "WhatsApp integrado",
    "Marca VitrinePro"
  ]'::jsonb,
  updated_at = NOW()
WHERE slug = 'free';

# Plans & Subscriptions API Documentation

Sistema completo de planos e assinaturas com trial de 7 dias e limites de produtos.

---

## 🎯 Planos Disponíveis

### 1. Free
- **Preço**: R$ 0,00/mês
- **Produtos**: Até 10
- **Trial**: Não tem
- **Features**: Catálogo básico, Orçamentos ilimitados, WhatsApp, SEO básico

### 2. Essencial
- **Preço**: R$ 49,90/mês
- **Produtos**: Até 50
- **Trial**: 7 dias
- **Features**: Tudo do Free + Variações, Múltiplas imagens, Analytics, Suporte prioritário

### 3. Pro
- **Preço**: R$ 129,00/mês
- **Produtos**: Ilimitados
- **Trial**: 7 dias
- **Features**: Tudo do Essencial + Dashboard avançado, Kanban, Analytics completo, Equipe, Tema personalizado, Domínio próprio

---

## 🔐 Super Admin - Gestão de Planos

### GET `/functions/v1/superadmin-plans`
Lista todos os planos.

**Auth**: Super admin (role = 3)

**Resposta:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Free",
      "slug": "free",
      "description": "Plano gratuito",
      "price_cents": 0,
      "max_products": 10,
      "trial_days": 0,
      "features": ["..."],
      "active": true,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    }
  ]
}
```

### POST `/functions/v1/superadmin-plans`
Criar novo plano.

**Auth**: Super admin (role = 3)

**Body:**
```json
{
  "name": "Enterprise",
  "slug": "enterprise",
  "description": "Plano empresarial",
  "price_cents": 29900,
  "max_products": -1,
  "trial_days": 14,
  "features": ["Feature 1", "Feature 2"],
  "active": true
}
```

**Resposta:**
```json
{
  "success": true,
  "plan": { /* plano criado */ }
}
```

### PUT `/functions/v1/superadmin-plans?planId=<uuid>`
Atualizar plano existente.

**Auth**: Super admin (role = 3)

**Body:**
```json
{
  "name": "Free Plus",
  "price_cents": 1990,
  "max_products": 20,
  "active": true
}
```

### DELETE `/functions/v1/superadmin-plans?planId=<uuid>`
Deletar plano (apenas se não tiver subscriptions ativas).

**Auth**: Super admin (role = 3)

**Resposta:**
```json
{
  "success": true,
  "message": "Plano deletado com sucesso"
}
```

**Erro se houver subscriptions:**
```json
{
  "error": "Não é possível deletar plano com subscriptions ativas",
  "activeSubscriptions": 5
}
```

---

## 💳 Subscriptions - Assinaturas

### POST `/functions/v1/subscription-confirm-payment`
Confirmar pagamento de subscription (Super Admin).

**Auth**: Super admin (role = 3)

**Body:**
```json
{
  "subscriptionId": "uuid"
}
```

**O que faz:**
- Marca `payment_confirmed = true`
- Define `payment_date = now()`
- Muda `status = 'active'`
- Reativa tenant (`active = true`)
- Cria notificação para tenant

**Resposta:**
```json
{
  "success": true,
  "message": "Pagamento confirmado com sucesso",
  "tenant": {
    "id": "uuid",
    "company_name": "Loja ABC"
  }
}
```

---

## 🏪 Tenant - Gestão de Subscription

### GET `/functions/v1/tenant-subscription`
Ver detalhes da subscription e limites.

**Auth**: Qualquer usuário autenticado do tenant

**Resposta:**
```json
{
  "subscription": {
    "id": "uuid",
    "status": "trial",
    "started_at": "2025-01-15T10:00:00Z",
    "trial_ends_at": "2025-01-22T10:00:00Z",
    "payment_confirmed": false,
    "payment_date": null
  },
  "plan": {
    "id": "uuid",
    "name": "Essencial",
    "slug": "essencial",
    "price_cents": 4990,
    "max_products": 50,
    "trial_days": 7,
    "features": ["..."]
  },
  "trial": {
    "active": true,
    "expired": false,
    "ends_at": "2025-01-22T10:00:00Z",
    "days_remaining": 5
  },
  "limits": {
    "max_products": 50,
    "current_products": 12,
    "can_create_products": true,
    "products_remaining": 38
  }
}
```

### POST `/functions/v1/tenant-change-plan`
Trocar de plano (upgrade/downgrade).

**Auth**: Owner do tenant (role = 2)

**Body:**
```json
{
  "planId": "uuid-do-novo-plano"
}
```

**Validações:**
- Plano existe e está ativo
- Não é o mesmo plano atual
- Se downgrade, verifica se quantidade de produtos atual cabe no novo plano

**Resposta:**
```json
{
  "success": true,
  "message": "Plano alterado para Pro com sucesso!",
  "plan": {
    "id": "uuid",
    "name": "Pro",
    "price_cents": 12900,
    "max_products": -1
  }
}
```

**Erro se ultrapassar limite:**
```json
{
  "error": "Você tem 75 produtos, mas o plano Essencial permite apenas 50. Remova alguns produtos antes de fazer o downgrade.",
  "currentProducts": 75,
  "planLimit": 50
}
```

### GET `/functions/v1/tenant-plan-usage`
Ver uso atual do plano.

**Auth**: Qualquer usuário autenticado do tenant

**Resposta:**
```json
{
  "plan": {
    "name": "Essencial",
    "max_products": 50,
    "unlimited": false
  },
  "current": {
    "total_products": 32
  },
  "limits": {
    "can_create_products": true,
    "products_remaining": 18,
    "usage_percentage": 64
  }
}
```

---

## ✅ Verificação de Limite de Produtos

### POST `/functions/v1/check-product-limit`
Verificar se pode criar produto (usado antes de INSERT).

**Auth**: Qualquer usuário autenticado do tenant

**Resposta se pode criar:**
```json
{
  "can_create": true,
  "current": 32,
  "limit": 50,
  "remaining": 18
}
```

**Resposta se atingiu limite (403):**
```json
{
  "can_create": false,
  "error": "Limite de produtos do plano atingido",
  "current": 50,
  "limit": 50,
  "plan": "Essencial",
  "message": "Você atingiu o limite de 50 produtos do plano Essencial. Faça upgrade para criar mais produtos."
}
```

**Resposta se ilimitado:**
```json
{
  "can_create": true,
  "unlimited": true,
  "message": "Produtos ilimitados"
}
```

---

## 📊 Status de Subscription

Os status possíveis são:

- **`trial`**: Em período de trial
- **`active`**: Ativo com pagamento confirmado
- **`past_due`**: Trial expirado ou pagamento vencido
- **`canceled`**: Cancelado

---

## 🔄 Fluxo Completo

### 1. Novo Tenant
```
1. Usuário cria conta
2. Trigger cria tenant
3. Trigger cria subscription no plano Free (sem trial)
4. Status: active
```

### 2. Upgrade para Essencial/Pro
```
1. Owner chama /tenant-change-plan com planId
2. Sistema verifica se plano permite (trial de 7 dias)
3. Subscription atualizada com novo plan_id
4. trial_ends_at = now() + 7 dias
5. Status: trial
```

### 3. Trial Expira
```
1. Após trial_ends_at < now()
2. Super Admin deve confirmar pagamento
3. Ou tenant volta para plano Free
```

### 4. Confirmação de Pagamento
```
1. Super Admin chama /subscription-confirm-payment
2. payment_confirmed = true
3. Status = active
4. Tenant reativado
5. Notificação criada
```

### 5. Criação de Produto
```
1. Frontend chama /check-product-limit
2. Se can_create = false → Bloqueia e mostra erro
3. Se can_create = true → Permite criação
4. Notificação criada se atingiu limite
```

---

## 🎯 Como Usar

### Verificar antes de criar produto:
```typescript
const { data, error } = await supabase.functions.invoke('check-product-limit');

if (error || !data.can_create) {
  toast.error(data.message || 'Limite atingido');
  return;
}

// Criar produto
```

### Ver subscription:
```typescript
const { data } = await supabase.functions.invoke('tenant-subscription');
console.log('Plano:', data.plan.name);
console.log('Trial expira em:', data.trial.days_remaining, 'dias');
console.log('Produtos:', data.limits.current_products, '/', data.limits.max_products);
```

### Trocar de plano:
```typescript
const { data, error } = await supabase.functions.invoke('tenant-change-plan', {
  body: { planId: 'uuid-do-plano' }
});

if (error) {
  toast.error(error.message);
} else {
  toast.success(data.message);
}
```

---

## 🔗 Links Úteis

- [Planos no Supabase](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/editor?table=plans)
- [Subscriptions no Supabase](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/editor?table=subscriptions)
- [Logs: superadmin-plans](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/functions/superadmin-plans/logs)
- [Logs: tenant-subscription](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/functions/tenant-subscription/logs)

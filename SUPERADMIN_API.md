# Super Admin API Documentation

Edge functions para gestão do painel super admin com autenticação obrigatória (role = 3).

---

## 🔐 Autenticação

Todas as funções exigem:
- Header `Authorization: Bearer <JWT>`
- Role = 3 (super admin) no `tenant_memberships`

---

## 📊 Dashboard - `/superadmin-dashboard`

Retorna métricas gerais do sistema.

### GET `/superadmin-dashboard`

**Resposta:**
```json
{
  "metrics": {
    "totalTenants": 45,
    "activeTenants": 38,
    "suspendedTenants": 7,
    "totalProducts": 1234,
    "totalQuotes": 567,
    "totalUsers": 45
  },
  "subscriptionsByStatus": {
    "trial": 12,
    "active": 28,
    "past_due": 3,
    "canceled": 2
  },
  "recentTenants": [
    {
      "id": "uuid",
      "company_name": "Loja ABC",
      "slug": "loja-abc",
      "email": "contato@abc.com",
      "active": true,
      "created_at": "2025-01-15T10:00:00Z",
      "subscription_status": "trial"
    }
  ]
}
```

---

## 🏢 Tenants - `/superadmin-tenants`

Gerenciar lojas (tenants).

### GET `/superadmin-tenants`

Lista todos os tenants com subscriptions.

**Resposta:**
```json
{
  "tenants": [
    {
      "id": "uuid",
      "company_name": "Loja XYZ",
      "slug": "loja-xyz",
      "email": "contato@xyz.com",
      "active": true,
      "subscriptions": {
        "id": "uuid",
        "plan_id": "uuid",
        "status": "active",
        "trial_ends_at": null,
        "payment_confirmed": true,
        "plans": {
          "name": "Pro",
          "slug": "pro",
          "price_cents": 12900
        }
      }
    }
  ]
}
```

### PUT `/superadmin-tenants?tenantId=<uuid>`

Atualizar tenant com ações específicas.

#### Ação: Suspender loja
```json
{
  "action": "suspend"
}
```

#### Ação: Reativar loja
```json
{
  "action": "reactivate"
}
```

#### Ação: Regenerar slug
```json
{
  "action": "regenerate_slug",
  "newSlug": "nova-loja-abc"
}
```

#### Ação: Alterar plano
```json
{
  "action": "change_plan",
  "planId": "uuid-do-plano"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Tenant atualizado com sucesso"
}
```

---

## 📝 Logs - `/superadmin-logs`

Buscar logs de auditoria.

### GET `/superadmin-logs`

**Query params:**
- `action` (opcional): filtrar por tipo de ação
- `tenantId` (opcional): filtrar por tenant
- `limit` (opcional, padrão: 100): limite de resultados
- `offset` (opcional, padrão: 0): offset para paginação

**Resposta:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "tenant_suspended",
      "tenant_id": "uuid",
      "user_id": "uuid",
      "meta": {
        "tenant_id": "uuid",
        "company_name": "Loja ABC"
      },
      "created_at": "2025-01-15T14:30:00Z",
      "tenant": {
        "company_name": "Loja ABC",
        "slug": "loja-abc"
      }
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

**Tipos de ação:**
- `tenant_suspended`
- `tenant_reactivated`
- `slug_regenerated`
- `plan_changed`
- `password_reset`

---

## 🔑 Reset Password - `/superadmin-reset-password`

Resetar senha de usuário.

### POST `/superadmin-reset-password`

**Body:**
```json
{
  "userId": "uuid-do-usuario",
  "newPassword": "novaSenha123!"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Senha resetada com sucesso"
}
```

---

## ⚠️ Erros Comuns

### 401 - Não autenticado
```json
{
  "error": "Não autenticado"
}
```

### 403 - Acesso negado
```json
{
  "error": "Acesso negado. Apenas super admins."
}
```

### 404 - Não encontrado
```json
{
  "error": "Tenant não encontrado"
}
```

### 400 - Parâmetros inválidos
```json
{
  "error": "tenantId é obrigatório"
}
```

---

## 📌 Exemplo de uso

```typescript
import { supabase } from "@/integrations/supabase/client";

// Buscar dashboard
const { data: dashboard } = await supabase.functions.invoke('superadmin-dashboard');

// Listar tenants
const { data: tenants } = await supabase.functions.invoke('superadmin-tenants', {
  method: 'GET'
});

// Suspender loja
const { data: result } = await supabase.functions.invoke('superadmin-tenants', {
  method: 'PUT',
  body: {
    action: 'suspend'
  }
});

// Buscar logs
const { data: logs } = await supabase.functions.invoke('superadmin-logs', {
  method: 'GET'
});
```

---

## 🔗 Links Úteis

- [Dashboard Supabase](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno)
- [Logs das Edge Functions](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/functions)

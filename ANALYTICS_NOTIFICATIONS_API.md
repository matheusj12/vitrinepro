# Analytics & Notifications API Documentation

Sistema de analytics por loja e notificações internas.

---

## 📊 Analytics

### POST `/functions/v1/analytics-log-event`
Registrar evento de analytics (público, sem auth).

**Body:**
```json
{
  "tenantId": "uuid",
  "eventType": "page_view|product_view|whatsapp_click|quote_created",
  "productId": "uuid (opcional, para product_view)",
  "meta": {
    "custom_data": "any"
  }
}
```

**Eventos válidos:**
- `page_view` - Visualização de página da vitrine
- `product_view` - Visualização de produto específico
- `whatsapp_click` - Clique no botão WhatsApp
- `quote_created` - Orçamento criado

**O que é capturado automaticamente:**
- IP do visitante
- User-Agent do navegador
- Timestamp

**Resposta:**
```json
{
  "success": true,
  "message": "Evento registrado"
}
```

---

### GET `/functions/v1/analytics-reports?type=<tipo>`
Buscar relatórios de analytics (requer auth).

**Auth**: Qualquer usuário do tenant

**Query params:**
- `type`: `views`, `products`, `whatsapp`, `quotes`
- `startDate` (opcional): Data início (ISO format)
- `endDate` (opcional): Data fim (ISO format)

#### Relatório de Views
```
GET /analytics-reports?type=views&startDate=2025-01-01&endDate=2025-01-31
```

**Resposta:**
```json
{
  "total_page_views": 1523
}
```

#### Relatório de Produtos
```
GET /analytics-reports?type=products&startDate=2025-01-01
```

**Resposta:**
```json
{
  "total_product_views": 456,
  "top_products": [
    {
      "product_id": "uuid",
      "views": 89,
      "name": "Produto A",
      "image_url": "https://..."
    },
    {
      "product_id": "uuid",
      "views": 67,
      "name": "Produto B",
      "image_url": "https://..."
    }
  ]
}
```

#### Relatório de WhatsApp
```
GET /analytics-reports?type=whatsapp
```

**Resposta:**
```json
{
  "total_whatsapp_clicks": 234
}
```

#### Relatório de Orçamentos
```
GET /analytics-reports?type=quotes
```

**Resposta:**
```json
{
  "total_quotes": 45,
  "quote_events": 45
}
```

---

## 🔔 Notificações

### GET `/functions/v1/notifications-list`
Listar notificações do tenant.

**Auth**: Qualquer usuário do tenant

**Query params:**
- `unreadOnly` (opcional): `true` para apenas não lidas
- `limit` (opcional, padrão: 50): Limite de resultados

**Resposta:**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "type": "trial_expiring",
      "message": "Seu trial expira em 2 dias!",
      "read": false,
      "created_at": "2025-01-15T10:00:00Z"
    },
    {
      "id": "uuid",
      "tenant_id": "uuid",
      "type": "product_limit",
      "message": "Limite de produtos atingido!",
      "read": true,
      "created_at": "2025-01-14T15:30:00Z"
    }
  ],
  "unread_count": 3
}
```

**Tipos de notificação:**
- `trial_expiring` - Trial expirando
- `store_suspended` - Loja suspensa
- `payment_confirmed` - Pagamento confirmado
- `product_limit` - Limite de produtos atingido
- `plan_changed` - Plano alterado

---

### POST `/functions/v1/notifications-mark-read`
Marcar notificação(ões) como lida(s).

**Auth**: Qualquer usuário do tenant

**Body - Marcar uma:**
```json
{
  "notificationId": "uuid"
}
```

**Body - Marcar todas:**
```json
{
  "markAll": true
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Notificação marcada como lida"
}
```

---

## 🎯 Como Usar

### Registrar evento na vitrine:
```typescript
// Quando visitante abre a vitrine
await supabase.functions.invoke('analytics-log-event', {
  body: {
    tenantId: tenant.id,
    eventType: 'page_view'
  }
});

// Quando visualiza produto
await supabase.functions.invoke('analytics-log-event', {
  body: {
    tenantId: tenant.id,
    eventType: 'product_view',
    productId: product.id
  }
});

// Quando clica no WhatsApp
await supabase.functions.invoke('analytics-log-event', {
  body: {
    tenantId: tenant.id,
    eventType: 'whatsapp_click'
  }
});
```

### Buscar relatório:
```typescript
const { data } = await supabase.functions.invoke('analytics-reports', {
  method: 'GET',
  // query params via URL
});

// Com params
const url = new URL(`${supabaseUrl}/functions/v1/analytics-reports`);
url.searchParams.append('type', 'products');
url.searchParams.append('startDate', '2025-01-01');

const response = await fetch(url, {
  headers: {
    Authorization: `Bearer ${session.access_token}`
  }
});
```

### Listar notificações:
```typescript
const { data } = await supabase.functions.invoke('notifications-list');

console.log('Não lidas:', data.unread_count);
console.log('Notificações:', data.notifications);
```

### Marcar como lida:
```typescript
// Uma notificação
await supabase.functions.invoke('notifications-mark-read', {
  body: { notificationId: 'uuid' }
});

// Todas
await supabase.functions.invoke('notifications-mark-read', {
  body: { markAll: true }
});
```

---

## 🔗 Links Úteis

- [Analytics Events no Supabase](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/editor?table=analytics_events)
- [Notifications no Supabase](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/editor?table=notifications)
- [Logs: analytics-log-event](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/functions/analytics-log-event/logs)
- [Logs: analytics-reports](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/functions/analytics-reports/logs)
- [Logs: notifications-list](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/functions/notifications-list/logs)

---

## 📝 Observações

- Eventos de analytics são públicos (não requerem auth)
- Relatórios de analytics requerem autenticação
- Notificações são criadas automaticamente pelo sistema
- Filtros de data em relatórios são opcionais
- Top 10 produtos mais vistos no relatório de produtos

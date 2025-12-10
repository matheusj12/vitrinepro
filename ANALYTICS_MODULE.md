# Módulo de Analytics - Documentação Completa

## Visão Geral

O módulo de Analytics coleta e exibe métricas importantes sobre o comportamento dos visitantes na vitrine pública. Todos os dados são coletados automaticamente e exibidos no painel do tenant.

## Eventos Coletados Automaticamente

### 1. page_view
**Quando**: Toda vez que a vitrine pública é acessada
**Local**: `/loja/:slug`
**Dados coletados**:
- tenant_id
- slug da loja
- timestamp
- IP address
- User agent

### 2. product_view
**Quando**: Toda vez que um produto é visualizado (clique em "Adicionar ao carrinho")
**Local**: Vitrine pública
**Dados coletados**:
- tenant_id
- product_id
- Nome do produto
- SKU do produto
- timestamp
- IP address
- User agent

### 3. whatsapp_click
**Quando**: Ao clicar no botão "Enviar Orçamento via WhatsApp"
**Local**: Página do carrinho (`/loja/:slug/carrinho`)
**Dados coletados**:
- tenant_id
- Nome do cliente
- Quantidade de itens no carrinho
- timestamp

### 4. quote_created
**Quando**: Quando um orçamento é criado com sucesso
**Local**: Página do carrinho
**Dados coletados**:
- tenant_id
- Nome do cliente
- Quantidade de itens
- Lista de produtos no orçamento
- timestamp

## Backend - Edge Functions

### POST /functions/v1/analytics-log-event
**Descrição**: Registra um evento de analytics.

**Body**:
```json
{
  "tenantId": "uuid-do-tenant",
  "eventType": "page_view | product_view | whatsapp_click | quote_created",
  "productId": "uuid-do-produto (opcional)",
  "meta": {
    "campo_personalizado": "valor"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Evento registrado"
}
```

**Autenticação**: Não requerida (público)

---

### POST /functions/v1/analytics-reports
**Descrição**: Gera relatórios de analytics por tipo.

**Body**:
```json
{
  "type": "views | products | whatsapp | quotes",
  "startDate": "2025-01-01T00:00:00Z (opcional)",
  "endDate": "2025-01-31T23:59:59Z (opcional)",
  "tenantId": "uuid-do-tenant (opcional se autenticado)"
}
```

**Tipos de relatório**:

#### type: "views"
```json
{
  "total_page_views": 150
}
```

#### type: "products"
```json
{
  "total_product_views": 450,
  "top_products": [
    {
      "product_id": "uuid",
      "name": "Produto A",
      "image_url": "https://...",
      "views": 120
    }
  ]
}
```

#### type: "whatsapp"
```json
{
  "total_whatsapp_clicks": 45
}
```

#### type: "quotes"
```json
{
  "total_quotes": 32
}
```

**Autenticação**: Requerida (Bearer token) ou pode receber tenantId no body

## Frontend - Dashboard de Analytics

**Localização**: `/dashboard` → Tab "Analytics"

**Componente**: `src/components/dashboard/AnalyticsDashboard.tsx`

### Métricas Exibidas

1. **Visitas à Vitrine**
   - Total de page_views no período selecionado
   - Filtro: 7 ou 30 dias

2. **Produtos Vistos**
   - Total de product_views no período
   - Visualizações únicas de produtos

3. **Cliques WhatsApp**
   - Total de whatsapp_click no período
   - Indica interesse em contato

4. **Orçamentos**
   - Total de orçamentos criados no período
   - Dados da tabela `quotes`

5. **Top 5 Produtos Mais Vistos**
   - Lista ordenada por visualizações
   - Inclui imagem, nome e contagem
   - Barra de progresso visual

6. **Taxa de Conversão**
   - Visitantes → Cliques WhatsApp
   - Visitantes → Orçamentos

7. **Últimos 10 Eventos**
   - Feed em tempo real dos últimos eventos
   - Ícones por tipo de evento
   - Timestamp formatado

## Banco de Dados

### Tabela: analytics_events

```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_type TEXT NOT NULL,
  product_id UUID REFERENCES products(id),
  meta JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_analytics_tenant ON analytics_events(tenant_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_product ON analytics_events(product_id);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
```

### RLS Policies

```sql
-- Qualquer um pode inserir eventos (público)
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);

-- Tenants podem ver seus próprios dados
CREATE POLICY "Tenants can view their own analytics"
  ON analytics_events FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM tenant_memberships
    WHERE user_id = auth.uid()
  ));

-- Super admins podem ver tudo
CREATE POLICY "Super admins can view all analytics"
  ON analytics_events FOR ALL
  USING (EXISTS (
    SELECT 1 FROM tenant_memberships
    WHERE user_id = auth.uid() AND role = 3
  ));
```

## Exemplo de Uso (Frontend)

### Registrar evento manualmente
```typescript
import { supabase } from "@/integrations/supabase/client";

const logEvent = async () => {
  await supabase.functions.invoke("analytics-log-event", {
    body: {
      tenantId: "uuid-tenant",
      eventType: "page_view",
      meta: {
        page: "/loja/minha-loja",
      },
    },
  });
};
```

### Buscar relatório
```typescript
const fetchReport = async () => {
  const { data } = await supabase.functions.invoke("analytics-reports", {
    body: {
      type: "products",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  });
  
  console.log(data.top_products);
};
```

## Segurança e Privacidade

1. **Isolamento de dados**: Cada tenant só vê seus próprios dados
2. **IP e User-Agent**: Coletados mas não exibidos publicamente
3. **GDPR**: Dados podem ser deletados sob requisição
4. **RLS**: Políticas de segurança garantem acesso apropriado

## Performance

- **Índices**: Tabela otimizada com índices em tenant_id, event_type, product_id e created_at
- **Agregação**: Cálculos feitos no backend para reduzir carga no frontend
- **Cache**: React Query cacheia dados por período para evitar chamadas desnecessárias

## Próximas Melhorias Possíveis

1. Gráficos de linha mostrando evolução temporal
2. Comparação entre períodos (mês atual vs mês passado)
3. Funil de conversão visual
4. Exportação de relatórios (CSV, PDF)
5. Alertas por email quando métricas atingirem thresholds
6. Heatmap de horários de maior acesso
7. Analytics de origem (UTM tracking)
8. Tempo médio na página
9. Taxa de rejeição
10. Produtos mais abandonados no carrinho

# API de Funcionalidades da Vitrine

Este documento detalha as APIs para busca, produtos populares, categorias e inteligência automática da vitrine.

---

## 1. Identidade Visual (Branding)

### Estrutura no `store_settings.branding`:

```json
{
  "store_title": "Nome da Loja",
  "logo_url": "https://...",
  "favicon_url": "https://...",
  "primary_color": "#F97316",
  "secondary_color": "#0EA5E9",
  "about_text": "Sobre nossa loja...",
  "about_image_url": "https://..."
}
```

### Limites de Banners por Plano:

- **Free**: 1 banner
- **Essencial**: 2 banners
- **Pro**: 3 banners

### Cores Personalizadas:

Apenas planos **Pro** podem personalizar cores. Planos Free/Essencial usam cores padrão do tema.

---

## 2. Busca Inteligente

### `GET /functions/v1/storefront-search`

Busca produtos por nome, SKU ou descrição, com paginação e logging automático.

**Query Parameters:**
- `slug` (obrigatório): slug do tenant
- `q` (obrigatório): termo de busca
- `page` (opcional): página atual (padrão: 1)
- `limit` (opcional): itens por página (padrão: 12)

**Resposta:**
```json
{
  "products": [
    {
      "id": "...",
      "name": "Produto X",
      "price": 99.90,
      "image_url": "...",
      "categories": {
        "id": "...",
        "name": "Categoria",
        "slug": "categoria"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 45,
    "totalPages": 4
  }
}
```

**Analytics:**
Cada busca é registrada automaticamente em `analytics_events` com `event_type: 'search'` e meta contendo `{ query, results_count }`.

---

## 3. Produtos Mais Vendidos/Populares

### `GET /functions/v1/storefront-top-products`

Retorna produtos mais populares baseado em:
- Visualizações de produto (peso 1x)
- Cliques no WhatsApp (peso 1x)
- Inclusão em orçamentos (peso 3x)

**Query Parameters:**
- `slug` (obrigatório): slug do tenant
- `limit` (opcional): quantidade de produtos (padrão: 10)

**Resposta:**
```json
{
  "products": [
    {
      "id": "...",
      "name": "Produto Mais Popular",
      "price": 149.90,
      "image_url": "...",
      "categories": {
        "id": "...",
        "name": "Categoria",
        "slug": "categoria"
      }
    }
  ]
}
```

**Fallback:**
Se não houver dados de analytics, retorna produtos com `featured = true`.

---

## 4. Categorias com Contagem de Produtos

### `GET /functions/v1/storefront-categories`

Retorna todas as categorias ativas com contagem de produtos ativos em cada uma.

**Query Parameters:**
- `slug` (obrigatório): slug do tenant

**Resposta:**
```json
{
  "categories": [
    {
      "id": "...",
      "name": "Eletrônicos",
      "slug": "eletronicos",
      "description": "...",
      "product_count": 24
    },
    {
      "id": "...",
      "name": "Roupas",
      "slug": "roupas",
      "description": "...",
      "product_count": 18
    }
  ]
}
```

---

## 5. Inteligência de Produtos

### `GET /functions/v1/product-intelligence`

Analisa dados dos últimos 30 dias para identificar:
- Produtos populares (top 20% em visualizações)
- Produtos mais cotados (mais incluídos em orçamentos)

**Query Parameters:**
- `tenantId` (obrigatório): ID do tenant

**Resposta:**
```json
{
  "popular_products": ["product-id-1", "product-id-2"],
  "most_quoted_products": ["product-id-3", "product-id-4"],
  "stats": {
    "total_views": 1250,
    "total_quotes": 85,
    "popular_threshold": 15
  }
}
```

**Uso:**
Frontend pode usar `popular_products` para adicionar badge "Popular" e `most_quoted_products` para seção "Mais Procurados".

---

## 6. Customização de Produtos (Nível Pro)

### Múltiplas Imagens

Usar tabela `product_images`:
```typescript
// Buscar imagens do produto
const { data: images } = await supabase
  .from('product_images')
  .select('*')
  .eq('product_id', productId)
  .order('position');
```

### Variações

Usar tabela `product_variations`:
```typescript
// Buscar variações ativas
const { data: variations } = await supabase
  .from('product_variations')
  .select('*')
  .eq('product_id', productId)
  .eq('active', true)
  .order('variation_type');
```

**Estrutura de Variação:**
```json
{
  "id": "...",
  "product_id": "...",
  "variation_type": "cor",
  "variation_value": "Azul",
  "price_adjustment": 10.00,
  "stock_quantity": 50,
  "sku_suffix": "AZ"
}
```

---

## 7. Tags Automáticas

### Tags Suportadas:

- **"Popular"**: Produtos no top 20% de visualizações (últimos 30 dias)
- **"Mais Vendida"**: Produtos com mais orçamentos (últimos 30 dias)
- **"Novo"**: Produtos criados há menos de 7 dias
- **"Promoção"**: Produtos marcados manualmente (campo futuro)

### Implementação Frontend:

```typescript
// Determinar se produto é novo
const isNew = new Date(product.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

// Consultar inteligência para popular/mais vendida
const { data: intelligence } = await supabase.functions.invoke('product-intelligence', {
  body: { tenantId }
});

const isPopular = intelligence.popular_products.includes(product.id);
const isBestSeller = intelligence.most_quoted_products.includes(product.id);
```

---

## 8. "Você Também Pode Gostar"

### Lógica:

Mostrar produtos da mesma categoria do produto atual, excluindo o produto atual.

```typescript
const { data: relatedProducts } = await supabase
  .from('products')
  .select('*')
  .eq('tenant_id', tenantId)
  .eq('category_id', currentProduct.category_id)
  .eq('active', true)
  .neq('id', currentProduct.id)
  .limit(4);
```

---

## 9. Navegação e Filtros (Pro)

### Filtros Disponíveis:

**Para todos os planos:**
- Por categoria
- Por nome (busca)

**Apenas Pro:**
- Por preço (menor/maior)
- Por popularidade (mais visualizados)
- Por mais cotados

### Exemplo de Filtro por Preço:

```typescript
// Ordem crescente
.order('price', { ascending: true })

// Ordem decrescente
.order('price', { ascending: false })
```

### Exemplo de Filtro por Popularidade:

Use o endpoint `product-intelligence` e ordene no frontend baseado em `popular_products`.

---

## Segurança

- **Endpoints públicos**: `storefront-search`, `storefront-top-products`, `storefront-categories`
- **Endpoint protegido**: `product-intelligence` (requer service role key)
- Todos endpoints validam `tenant.active = true`
- Apenas produtos `active = true` são retornados

---

## Performance

- Buscas com ILIKE podem ser lentas em grandes catálogos (>10k produtos)
- Considerar índices em `products(name, sku)` para otimização
- Analytics são agregados sob demanda (caching recomendado no frontend)
- Contagem de categorias usa queries paralelas (Promise.all)

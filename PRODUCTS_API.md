# API de Produtos - Documentação

## Melhorias Implementadas (PROMPT 1)

### 1. Controle de Estoque
Campo `stock_control_enabled` adicionado à tabela `products`:
- `stock_control_enabled` (boolean): Habilita/desabilita controle de estoque
- `stock_quantity` (integer): Quantidade em estoque

### 2. Múltiplas Imagens por Produto
Tabela `product_images` criada:
- `id` (uuid): ID único
- `product_id` (uuid): Referência ao produto
- `url` (text): URL da imagem
- `position` (integer): Ordem de exibição
- `created_at` (timestamp): Data de criação

**Ordenação**: Use campo `position` para controlar ordem de exibição.

### 3. Variações de Produto
Tabela `product_variations` criada para suportar variações (cor, tamanho, etc):
- `id` (uuid): ID único
- `product_id` (uuid): Referência ao produto
- `variation_type` (text): Tipo da variação (color, size, material)
- `variation_value` (text): Valor (Azul, M, Couro)
- `price_adjustment` (decimal): Ajuste de preço (+/-)
- `sku_suffix` (text): Sufixo para SKU
- `stock_quantity` (integer): Estoque por variação
- `active` (boolean): Ativa/inativa
- `created_at`, `updated_at` (timestamp)

### 4. Endpoint: Ativar/Desativar Produto
**Edge Function**: `toggle-product`

**Endpoint**: `POST /functions/v1/toggle-product`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**:
```json
{
  "productId": "uuid-do-produto",
  "active": true
}
```

**Response**:
```json
{
  "success": true,
  "productId": "uuid-do-produto",
  "active": true
}
```

**Validações**:
- Usuário deve estar autenticado
- Usuário deve ter role >= 1 no tenant do produto
- Produto deve existir

**Exemplo cURL**:
```bash
curl -X POST https://rtljfxgxpgzabbsmqwno.supabase.co/functions/v1/toggle-product \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"productId":"uuid","active":false}'
```

### 5. Endpoint: Clonar Produto
**Edge Function**: `clone-product`

**Endpoint**: `POST /functions/v1/clone-product`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body**:
```json
{
  "productId": "uuid-do-produto-original"
}
```

**Response**:
```json
{
  "success": true,
  "originalProductId": "uuid-original",
  "newProduct": {
    "id": "uuid-novo",
    "name": "Nome do Produto (Cópia)",
    "slug": "slug-copia-timestamp",
    "active": false,
    ...
  }
}
```

**Comportamento**:
- Clona produto principal
- Clona todas as imagens (product_images)
- Clona todas as variações (product_variations)
- Novo produto inicia **inativo** (`active: false`)
- Novo produto inicia com **estoque zerado**
- Nome recebe sufixo "(Cópia)"
- SKU recebe sufixo "-COPY"
- Slug recebe timestamp para unicidade

**Validações**:
- Usuário deve estar autenticado
- Usuário deve ter role >= 1 no tenant do produto
- Produto original deve existir

**Exemplo cURL**:
```bash
curl -X POST https://rtljfxgxpgzabbsmqwno.supabase.co/functions/v1/clone-product \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"productId":"uuid-original"}'
```

## Exemplos de Uso (SDK)

### Inserir Múltiplas Imagens
```typescript
import { supabase } from "@/integrations/supabase/client";

const images = [
  { product_id: productId, url: "https://...", position: 0 },
  { product_id: productId, url: "https://...", position: 1 },
  { product_id: productId, url: "https://...", position: 2 },
];

const { error } = await supabase
  .from("product_images")
  .insert(images);
```

### Buscar Produto com Imagens
```typescript
const { data, error } = await supabase
  .from("products")
  .select(`
    *,
    product_images (
      id,
      url,
      position
    )
  `)
  .eq("id", productId)
  .single();

// Ordenar imagens por position
data.product_images.sort((a, b) => a.position - b.position);
```

### Criar Variação de Produto
```typescript
const variation = {
  product_id: productId,
  variation_type: "color",
  variation_value: "Azul",
  price_adjustment: 5.00, // R$ 5,00 a mais
  sku_suffix: "AZUL",
  stock_quantity: 10,
  active: true,
};

const { error } = await supabase
  .from("product_variations")
  .insert(variation);
```

### Buscar Variações de um Produto
```typescript
const { data, error } = await supabase
  .from("product_variations")
  .select("*")
  .eq("product_id", productId)
  .eq("active", true)
  .order("variation_type, variation_value");
```

### Ativar/Desativar Produto (Frontend)
```typescript
import { supabase } from "@/integrations/supabase/client";

const toggleProduct = async (productId: string, active: boolean) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    `https://rtljfxgxpgzabbsmqwno.supabase.co/functions/v1/toggle-product`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId, active }),
    }
  );

  return response.json();
};
```

### Clonar Produto (Frontend)
```typescript
const cloneProduct = async (productId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  const response = await fetch(
    `https://rtljfxgxpgzabbsmqwno.supabase.co/functions/v1/clone-product`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ productId }),
    }
  );

  return response.json();
};
```

## RLS (Row Level Security)

### product_images
- **SELECT**: Qualquer um pode ver imagens de produtos ativos ou de produtos do próprio tenant
- **INSERT/UPDATE/DELETE**: Apenas membros do tenant (role >= 1)

### product_variations
- **SELECT**: Qualquer um pode ver variações ativas de produtos ativos
- **INSERT/UPDATE/DELETE**: Apenas membros do tenant (role >= 1)

## Índices Criados

Para otimizar performance:
- `idx_product_images_product`: Buscar imagens por produto
- `idx_product_images_position`: Ordenar imagens por posição
- `idx_product_variations_product`: Buscar variações por produto
- `idx_product_variations_type`: Filtrar variações por tipo

## Próximos Passos

Para integrar no frontend:
1. Atualizar ProductsManager para suportar múltiplas imagens
2. Adicionar UI para gerenciar variações
3. Adicionar botões de ativar/desativar e clonar
4. Atualizar vitrine para mostrar variações
5. Adicionar controle de estoque no carrinho

## Logs

Logs de operações podem ser visualizados em:
- Edge Functions: https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/functions/toggle-product/logs
- Edge Functions: https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/functions/clone-product/logs

# Themes API Documentation

Sistema de temas para vitrines públicas com suporte a temas Free e Pro.

---

## 🎨 Temas Disponíveis

### 1. Free Classic (Gratuito)
- **Slug**: `free-classic`
- **Tipo**: `free`
- **Layout**: Clássico
- **Grid**: 1 coluna mobile, 2 tablet, 3 desktop
- **Features**: Básico

### 2. Essencial Clean (Pro)
- **Slug**: `essencial-clean`
- **Tipo**: `pro`
- **Layout**: Limpo e minimalista
- **Grid**: 2 colunas mobile, 3 tablet, 4 desktop
- **Features**: Quick view, sticky add-to-cart
- **Requisito**: Plano Essencial ou Pro

### 3. Pro Premium (Pro)
- **Slug**: `pro-premium`
- **Tipo**: `pro`
- **Layout**: Premium com recursos avançados
- **Grid**: 2 colunas mobile, 3 tablet, 4 desktop (masonry)
- **Features**: Quick view, wishlist, comparação, filtros avançados, animações
- **Requisito**: Plano Pro

---

## 📋 Estrutura de Configuração do Tema

```json
{
  "layout": "classic|clean|premium",
  "productCard": {
    "style": "card|minimal|elevated",
    "showPrice": true,
    "showDescription": true,
    "imageAspectRatio": "square|portrait|auto",
    "hoverEffect": "zoom|lift",
    "showBadges": true
  },
  "header": {
    "position": "fixed|sticky",
    "showSearch": true,
    "showCart": true,
    "showCategories": true,
    "transparent": false
  },
  "banner": {
    "style": "simple|fullwidth|slider",
    "height": "medium|large|xlarge",
    "autoplay": true,
    "overlay": true
  },
  "colors": {
    "useStorePrimary": true,
    "customAccent": true,
    "customPalette": true
  },
  "grid": {
    "columns": {
      "mobile": 1,
      "tablet": 2,
      "desktop": 3
    },
    "gap": "large",
    "masonry": false
  },
  "features": {
    "productQuickView": true,
    "stickyAddToCart": true,
    "wishlist": false,
    "productComparison": false,
    "advancedFilters": false
  },
  "animations": {
    "enabled": true,
    "type": "smooth"
  }
}
```

---

## 🔐 Edge Function: Selecionar Tema

### POST `/functions/v1/tenant-select-theme`

Permite que o tenant (admin/owner) selecione um tema para sua vitrine.

**Autenticação**: Obrigatória (role >= 1)

**Body:**
```json
{
  "themeId": "uuid-do-tema"
}
```

**Validações:**
- Verifica se usuário é admin/owner do tenant
- Verifica se tema existe e está ativo
- Se tema é PRO, valida se tenant tem plano Essencial ou Pro

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Tema 'Essencial Clean' selecionado com sucesso",
  "theme": {
    "id": "uuid",
    "name": "Essencial Clean",
    "type": "pro"
  }
}
```

**Erros:**

401 - Não autenticado:
```json
{
  "error": "Não autenticado"
}
```

403 - Acesso negado:
```json
{
  "error": "Acesso negado. Apenas admins."
}
```

403 - Plano insuficiente:
```json
{
  "error": "Tema PRO disponível apenas para planos Essencial ou Pro",
  "requiredPlan": "essencial"
}
```

404 - Tema não encontrado:
```json
{
  "error": "Tema não encontrado ou inativo"
}
```

---

## 📱 Responsividade Mobile-First

Todos os temas são otimizados para mobile-first:

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (sm a lg)
- **Desktop**: > 1024px (lg+)

### Grid Responsivo
- Adapta automaticamente baseado na configuração do tema
- Usa classes Tailwind: `grid-cols-{mobile} sm:grid-cols-{tablet} lg:grid-cols-{desktop}`

### Componentes Responsivos
- **Header**: Tamanhos de texto e padding ajustáveis
- **Banner**: Altura ajustável por dispositivo
- **Cards de Produto**: Imagens e texto com tamanhos responsivos
- **Botões**: Tamanho `sm` em mobile, padrão em desktop

---

## 🎯 Como Usar

### 1. Listar temas disponíveis

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data: themes } = await supabase
  .from('themes')
  .select('*')
  .eq('active', true);
```

### 2. Selecionar tema (admin)

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.functions.invoke('tenant-select-theme', {
  body: { themeId: 'uuid-do-tema' }
});

if (error) {
  console.error('Erro ao selecionar tema:', error);
} else {
  console.log('Tema selecionado:', data.theme.name);
}
```

### 3. Buscar tema da vitrine

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data: settings } = await supabase
  .from('store_settings')
  .select(`
    *,
    themes (*)
  `)
  .eq('tenant_id', tenantId)
  .single();

const theme = settings?.themes;
```

### 4. Aplicar configuração do tema

```typescript
const gridColumns = theme?.config?.grid?.columns || {
  mobile: 1,
  tablet: 2,
  desktop: 3
};

const gridClasses = `grid grid-cols-${gridColumns.mobile} sm:grid-cols-${gridColumns.tablet} lg:grid-cols-${gridColumns.desktop} gap-4 sm:gap-6`;
```

---

## 🔗 Links Úteis

- [Temas no Supabase](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/editor?table=themes)
- [Store Settings](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/editor?table=store_settings)
- [Logs: tenant-select-theme](https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/functions/tenant-select-theme/logs)

---

## 📝 Observações

- Novos tenants são criados automaticamente com o tema **Free Classic**
- Temas PRO requerem plano Essencial ou Pro ativo
- Configurações de tema são aplicadas automaticamente na vitrine
- Design visual permanece consistente entre temas
- Apenas grid e responsividade são alterados nesta versão

# SaaS Multi-Tenant - Frontend Documentation

## Visão Geral

Frontend completo do SaaS multi-tenant de catálogo de produtos e orçamentos, implementado em React + TypeScript + Vite + Tailwind CSS. Totalmente mobile-first e integrado com backend Supabase.

## Stack Tecnológica

- **React 18** + TypeScript
- **Vite** (bundler)
- **Tailwind CSS** (estilização)
- **Supabase** (backend/auth/database)
- **TanStack Query** (gerenciamento de estado/cache)
- **React Router** (rotas)
- **Zustand** (carrinho)
- **Sonner** (toasts)
- **shadcn/ui** (componentes)

## Estrutura do Projeto

```
src/
├── components/
│   ├── ui/              # Componentes shadcn/ui
│   ├── dashboard/       # Componentes do painel do tenant
│   │   ├── ProductsManager.tsx
│   │   ├── CategoriesManager.tsx
│   │   ├── BannersManager.tsx
│   │   ├── QuotesManager.tsx
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── NotificationsManager.tsx
│   │   └── SettingsManager.tsx
│   └── superadmin/      # Componentes do painel superadmin
│       ├── TenantsManager.tsx
│       ├── UsersManager.tsx
│       ├── PlansManager.tsx
│       └── LogsViewer.tsx
├── hooks/
│   ├── useAuth.ts       # Hook de autenticação
│   ├── useTenant.ts     # Hook de tenant
│   ├── useCart.ts       # Hook de carrinho (zustand)
│   └── useSuperAdmin.ts # Hook de verificação superadmin
├── pages/
│   ├── Index.tsx        # Landing page
│   ├── Auth.tsx         # Login/Registro
│   ├── Dashboard.tsx    # Painel do tenant
│   ├── SuperAdmin.tsx   # Painel superadmin
│   ├── Storefront.tsx   # Vitrine pública
│   ├── Cart.tsx         # Carrinho/Orçamento
│   └── NotFound.tsx     # 404
├── types/
│   └── database.ts      # Tipos TypeScript
├── integrations/
│   └── supabase/        # Cliente e tipos Supabase
└── lib/
    └── utils.ts         # Utilitários

```

## Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- npm ou bun

### Setup

1. Clone o repositório
2. Instale as dependências:

```bash
npm install
# ou
bun install
```

3. As variáveis de ambiente já estão configuradas no Supabase client (`src/integrations/supabase/client.ts`)

4. Execute em desenvolvimento:

```bash
npm run dev
# ou
bun dev
```

5. Build para produção:

```bash
npm run build
```

## Rotas da Aplicação

### Públicas

| Rota | Descrição |
|------|-----------|
| `/` | Landing page (venda do SaaS) |
| `/auth` | Login e registro |
| `/loja/:slug` | Vitrine pública do tenant |
| `/loja/:slug/carrinho` | Carrinho e formulário de orçamento |

### Protegidas (Tenant)

| Rota | Descrição |
|------|-----------|
| `/dashboard` | Painel principal do tenant |
| `/dashboard?tab=products` | Gestão de produtos (CRUD) |
| `/dashboard?tab=categories` | Gestão de categorias |
| `/dashboard?tab=banners` | Gestão de banners |
| `/dashboard?tab=quotes` | Visualização de orçamentos recebidos |
| `/dashboard?tab=analytics` | Analytics da vitrine |
| `/dashboard?tab=notifications` | Notificações do sistema |
| `/dashboard?tab=settings` | Configurações (WhatsApp, logo, tema) |

### Protegidas (Super Admin)

| Rota | Descrição |
|------|-----------|
| `/superadmin` | Dashboard geral |
| `/superadmin?tab=tenants` | Gestão de tenants |
| `/superadmin?tab=users` | Gestão de usuários |
| `/superadmin?tab=plans` | Gestão de planos |
| `/superadmin?tab=logs` | Logs de auditoria |

## APIs/Endpoints Consumidos

### Autenticação (Supabase Auth)

```typescript
// Login
supabase.auth.signInWithPassword({ email, password })

// Registro
supabase.auth.signUp({ email, password })

// Logout
supabase.auth.signOut()

// Sessão atual
supabase.auth.getSession()

// Listener de mudanças
supabase.auth.onAuthStateChange(callback)
```

### Banco de Dados (Supabase)

**Tabelas principais:**

- `tenants` - Lojas/empresas
- `tenant_memberships` - Relacionamento usuário-tenant-role
- `products` - Produtos do catálogo
- `categories` - Categorias de produtos
- `banners` - Banners da vitrine
- `quotes` - Orçamentos recebidos
- `quote_items` - Itens dos orçamentos
- `store_settings` - Configurações da loja
- `plans` - Planos do SaaS
- `subscriptions` - Assinaturas dos tenants
- `notifications` - Notificações internas
- `analytics_events` - Eventos de analytics
- `admin_logs` - Logs de auditoria
- `themes` - Temas da vitrine

### Edge Functions (Backend)

**Públicas:**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/storefront-search` | GET | Busca de produtos |
| `/storefront-top-products` | GET | Produtos mais populares |
| `/storefront-categories` | GET | Categorias com contagem |
| `/product-intelligence` | POST | Analytics de produtos |

**Protegidas (Tenant):**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/check-product-limit` | POST | Verifica limite de produtos do plano |
| `/clone-product` | POST | Clona um produto |
| `/toggle-product` | PUT | Ativa/desativa produto |
| `/tenant-plan-usage` | GET | Uso do plano atual |
| `/tenant-subscription` | GET | Dados da assinatura |
| `/tenant-change-plan` | POST | Troca de plano |
| `/tenant-select-theme` | POST | Seleciona tema da vitrine |
| `/notifications-list` | GET | Lista notificações |
| `/notifications-mark-read` | PUT | Marca notificação como lida |
| `/analytics-log-event` | POST | Registra evento de analytics |
| `/analytics-reports` | GET | Relatórios de analytics |

**Protegidas (Super Admin):**

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/superadmin-dashboard` | GET | Métricas gerais |
| `/superadmin-tenants` | GET/PUT/DELETE | Gestão de tenants |
| `/superadmin-users` | GET/PUT | Gestão de usuários |
| `/superadmin-products` | GET | Visualizar produtos |
| `/superadmin-plans` | GET/POST/PUT/DELETE | CRUD de planos |
| `/superadmin-logs` | GET | Logs de auditoria |
| `/superadmin-reset-password` | POST | Reset de senha |
| `/create-superadmin` | POST | Criar super admin (sem auth) |

## Componentes Principais

### Dashboard do Tenant

**ProductsManager** (`src/components/dashboard/ProductsManager.tsx`)
- CRUD completo de produtos
- Upload de imagem (URL)
- Seleção de categoria
- Ativar/desativar produtos
- Validação de dados

**CategoriesManager** (`src/components/dashboard/CategoriesManager.tsx`)
- CRUD de categorias
- Geração automática de slug

**BannersManager** (`src/components/dashboard/BannersManager.tsx`)
- CRUD de banners
- Ordenação
- Ativação/desativação
- Preview de imagem

**QuotesManager** (`src/components/dashboard/QuotesManager.tsx`)
- Lista de orçamentos recebidos
- Detalhes do cliente
- Itens do orçamento
- Data de criação

**AnalyticsDashboard** (`src/components/dashboard/AnalyticsDashboard.tsx`)
- Visitas à vitrine
- Produtos mais vistos
- Cliques no WhatsApp
- Últimos eventos

**NotificationsManager** (`src/components/dashboard/NotificationsManager.tsx`)
- Lista de notificações
- Marcar como lida
- Contador de não lidas

**SettingsManager** (`src/components/dashboard/SettingsManager.tsx`)
- Configuração de WhatsApp
- Upload de logo
- Texto "Sobre a Loja"
- Imagem "Sobre"
- URL da vitrine

### Super Admin

**TenantsManager** (`src/components/superadmin/TenantsManager.tsx`)
- Lista todos os tenants
- Suspender/reativar
- Regenerar slug
- Trocar plano
- Deletar (cascade)

**UsersManager** (`src/components/superadmin/UsersManager.tsx`)
- Lista todos os usuários
- Ver tenants associados
- Resetar senha
- Bloquear/desbloquear

**PlansManager** (`src/components/superadmin/PlansManager.tsx`)
- CRUD de planos
- Definir preço, limite de produtos, trial
- Ativar/desativar

**LogsViewer** (`src/components/superadmin/LogsViewer.tsx`)
- Visualização de logs de auditoria
- Filtro por ação e tenant

### Público

**Storefront** (`src/pages/Storefront.tsx`)
- Vitrine pública por slug
- Banners em carrossel
- Categorias
- Produtos com imagem e preço
- Botão "Adicionar ao Carrinho"

**Cart** (`src/pages/Cart.tsx`)
- Lista de produtos selecionados
- Ajuste de quantidade
- Formulário de contato
- Geração de link WhatsApp
- Persistência do orçamento no DB

## Fluxos de Usuário

### 1. Fluxo de Registro e Setup

1. Usuário acessa `/auth`
2. Preenche nome, email e senha
3. Sistema cria usuário no Supabase Auth
4. Trigger automático cria tenant e membership
5. Usuário é redirecionado para `/dashboard`

### 2. Fluxo de Configuração da Loja

1. Acessa `/dashboard?tab=settings`
2. Configura WhatsApp
3. Faz upload de logo
4. Escreve texto "Sobre"
5. Configurações são salvas em `store_settings`

### 3. Fluxo de Cadastro de Produtos

1. Acessa `/dashboard?tab=products`
2. Clica em "Novo Produto"
3. Preenche nome, SKU, descrição, preço, etc.
4. Seleciona categoria
5. Salva produto

### 4. Fluxo de Orçamento Público

1. Cliente acessa `/loja/:slug`
2. Navega pelos produtos
3. Adiciona produtos ao carrinho
4. Clica em "Carrinho"
5. Preenche nome, email, WhatsApp, observações
6. Clica em "Enviar Orçamento via WhatsApp"
7. Sistema:
   - Salva orçamento no DB
   - Gera link WhatsApp com mensagem formatada
   - Abre WhatsApp com mensagem pré-preenchida

### 5. Fluxo Super Admin

1. Super admin faz login com `admin@admin.com.br`
2. Acessa `/superadmin`
3. Visualiza métricas gerais
4. Gerencia tenants (suspender, trocar plano, etc.)
5. Gerencia usuários (resetar senha, bloquear)
6. Cria/edita planos
7. Visualiza logs de auditoria

## Hooks Personalizados

### useAuth

```typescript
const { user, session, loading } = useAuth();
```

Gerencia estado de autenticação, sessão e loading.

### useTenant

```typescript
const { data: tenantData, isLoading } = useTenant(userId);
```

Busca dados do tenant e role do usuário autenticado.

### useTenantBySlug

```typescript
const { data: tenant, isLoading } = useTenantBySlug(slug);
```

Busca tenant público por slug (para vitrine).

### useCart

```typescript
const { items, addItem, removeItem, updateQuantity, clearCart, getTotalItems } = useCart();
```

Gerencia carrinho de compras com persistência no localStorage (Zustand).

### useSuperAdmin

```typescript
const { isSuperAdmin, loading } = useSuperAdmin();
```

Verifica se usuário é super admin e redireciona se necessário.

## Proteção de Rotas

**Rotas protegidas (tenant):**
- Verificam `user` do `useAuth`
- Redirecionam para `/auth` se não autenticado

**Rotas protegidas (super admin):**
- Verificam `role === 3` em `tenant_memberships`
- Redirecionam para `/dashboard` se não for super admin

## Design System

O projeto usa tokens CSS definidos em `src/index.css` e configuração Tailwind em `tailwind.config.ts`.

**Não edite** `index.css` ou `tailwind.config.ts` diretamente. Use os tokens existentes para manter consistência.

### Tokens principais:

- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`
- `--radius`

## Validação e Tratamento de Erros

- Formulários usam validação HTML5 básica (`required`)
- Erros do Supabase são capturados e exibidos via `toast.error()`
- Sucessos exibidos via `toast.success()`
- Loading states em botões (`disabled` + "Salvando...")

## Integração WhatsApp

Formato do link gerado:

```
https://api.whatsapp.com/send?phone=5511999999999&text=MENSAGEM_CODIFICADA
```

A mensagem inclui:
- Saudação com nome do cliente
- Lista de produtos com quantidade
- Observações do cliente
- Link da vitrine

Exemplo de mensagem:

```
Olá! Meu nome é João Silva.

Gostaria de solicitar um orçamento dos seguintes produtos:

- Produto A (Qtd: 2)
- Produto B (Qtd: 1)

Observações: Preciso com urgência

Vitrine: https://app.com/loja/loja-exemplo
```

## Temas da Vitrine

Temas disponíveis:

| Tema | Tipo | Grid |
|------|------|------|
| Free Classic | free | 2 colunas |
| Essencial Clean | pro | 3 colunas |
| Pro Premium | pro | 4 colunas |

Temas são aplicados dinamicamente via `storefront.config.grid` no componente `Storefront.tsx`.

## Analytics

Eventos rastreados:

- `page_view` - Visita à vitrine
- `product_view` - Visualização de produto
- `whatsapp_click` - Clique no botão WhatsApp
- `quote_created` - Orçamento criado

Dados armazenados:
- `tenant_id`
- `event_type`
- `product_id` (quando aplicável)
- `ip_address`
- `user_agent`
- `meta` (JSON)
- `created_at`

## Notificações Automáticas

O sistema gera notificações para:

- Trial prestes a expirar
- Trial expirado
- Pagamento confirmado
- Limite de produtos atingido
- Tenant suspenso/reativado

Notificações aparecem no painel do tenant em `/dashboard?tab=notifications`.

## Planos e Limites

**Planos padrão:**

| Plano | Preço | Produtos | Trial |
|-------|-------|----------|-------|
| Free | R$ 0 | 10 | 0 dias |
| Essencial | R$ 49,90 | 50 | 7 dias |
| Pro | R$ 129,00 | Ilimitado | 7 dias |

Validação de limite:
- Endpoint `/check-product-limit` verifica antes de criar produto
- Frontend exibe mensagem de erro se limite atingido

## Logs de Auditoria

Todas as ações de super admin são registradas em `admin_logs`:

- Ação realizada
- Tenant afetado
- Usuário que executou
- Metadados (JSON)
- Data/hora

Logs são visíveis em `/superadmin?tab=logs`.

## Build e Deploy

### Build de produção:

```bash
npm run build
```

Gera pasta `dist/` com arquivos estáticos otimizados.

### Preview local do build:

```bash
npm run preview
```

### Deploy:

O frontend pode ser deployado em:
- Vercel
- Netlify
- Cloudflare Pages
- Qualquer host de assets estáticos

Certifique-se de configurar as variáveis de ambiente do Supabase (se necessário) e o redirecionamento para `index.html` em rotas SPA.

## Estrutura de Dados

### Tenant

```typescript
{
  id: string;
  user_id: string | null;
  company_name: string;
  slug: string;
  email: string | null;
  whatsapp_number: string | null;
  primary_color: string;
  subscription_status: string;
  trial_ends_at: string | null;
  active: boolean;
}
```

### Product

```typescript
{
  id: string;
  tenant_id: string;
  category_id: string | null;
  name: string;
  slug: string;
  sku: string | null;
  description: string | null;
  price: number | null;
  min_quantity: number;
  image_url: string | null;
  featured: boolean;
  active: boolean;
}
```

### Quote

```typescript
{
  id: string;
  tenant_id: string;
  customer_name: string;
  customer_email: string | null;
  customer_whatsapp: string;
  observations: string | null;
  message_text: string | null;
  status: string;
}
```

## Troubleshooting

### Erro: "No user found"
- Verifique se o usuário está autenticado
- Limpe o localStorage e faça login novamente

### Erro: "Permission denied"
- Verifique RLS policies no Supabase
- Certifique-se de que o usuário tem o role correto

### Erro: "Product limit reached"
- Verifique o plano do tenant
- Considere upgrade para plano superior

### Erro: "Tenant not found"
- Verifique se o slug está correto
- Certifique-se de que o tenant está ativo

### Analytics não aparecem
- Verifique se os eventos estão sendo registrados
- Confirme que o `tenant_id` está correto nos eventos

## Próximas Melhorias (Roadmap)

- [ ] Upload de imagens via Supabase Storage
- [ ] Editor WYSIWYG para descrição de produtos
- [ ] Galeria múltipla de imagens por produto
- [ ] Variações de produtos (tamanho, cor)
- [ ] Filtros avançados na vitrine
- [ ] Carrinho persistente por sessão
- [ ] Integração com gateway de pagamento
- [ ] Exportação de orçamentos em PDF
- [ ] Relatórios avançados de analytics
- [ ] Sistema de tags para produtos
- [ ] Busca com autocomplete
- [ ] Modo dark/light

## Contato e Suporte

Para dúvidas ou suporte, consulte a documentação completa do backend em `SUPERADMIN_API.md`, `STOREFRONT_FEATURES_API.md`, `PLANS_SUBSCRIPTIONS_API.md`, etc.

---

**Versão:** 1.0.0  
**Última atualização:** 2025-01-24

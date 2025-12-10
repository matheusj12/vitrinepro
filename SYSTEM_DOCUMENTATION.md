# 📚 Documentação Completa do Sistema - Catálogo Virtual SaaS

## 🎯 Visão Geral do Sistema

**Catálogo Virtual** é uma plataforma SaaS multi-tenant para criação e gerenciamento de vitrines digitais e geração de orçamentos via WhatsApp.

### Conceito Principal
- Cada **tenant** (loja) possui seu próprio catálogo de produtos, categorias, banners e orçamentos
- Clientes visitam a vitrine pública via slug único: `/loja/[slug]`
- Sistema de orçamentos integrado com WhatsApp para conversão de leads
- Painel administrativo completo para gerenciar produtos e configurações
- Painel de super-administrador para gestão de tenants e planos

---

## 🏗️ Arquitetura do Sistema

### Stack Tecnológica

**Frontend:**
- React 18.3 com TypeScript
- Vite (build tool)
- TailwindCSS (estilização)
- Shadcn/ui (componentes)
- React Router DOM (rotas)
- TanStack Query (gerenciamento de estado assíncrono)
- Zustand (carrinho de compras)

**Backend:**
- Supabase (BaaS - Backend as a Service)
- PostgreSQL (banco de dados)
- Supabase Edge Functions (Deno serverless)
- Row Level Security (RLS) para isolamento multi-tenant

**Serviços Externos:**
- Resend (envio de e-mails transacionais)
- WhatsApp Business API (geração de links de orçamento)
- Supabase Storage (upload de logos e imagens)

---

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### 1. `tenants` (Lojas)
Armazena informações de cada loja/tenant no sistema.

**Campos principais:**
- `id` (UUID, PK): Identificador único
- `user_id` (UUID): Dono principal do tenant
- `company_name` (TEXT): Nome da empresa
- `slug` (TEXT, UNIQUE): URL única da vitrine (ex: "loja-exemplo")
- `email` (TEXT): E-mail de contato
- `whatsapp_number` (TEXT): Número do WhatsApp
- `primary_color` (TEXT): Cor primária da marca
- `subscription_status` (TEXT): Status da assinatura (trial/active/past_due/canceled)
- `trial_ends_at` (TIMESTAMP): Data de fim do trial
- `custom_domain` (TEXT): Domínio personalizado (se houver)
- `custom_domain_verified` (BOOLEAN): Se o domínio foi verificado
- `active` (BOOLEAN): Se o tenant está ativo

**Relacionamentos:**
- 1:N com `products`, `categories`, `banners`, `quotes`
- 1:1 com `store_settings`, `subscriptions`
- 1:N com `tenant_memberships` (usuários associados)

---

#### 2. `tenant_memberships` (Permissões)
Controla quem tem acesso a cada tenant e com qual nível de permissão.

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `user_id` (UUID, FK → auth.users)
- `role` (INTEGER): Nível de permissão
  - `1` = Membro/Editor
  - `2` = Owner/Dono
  - `3` = Super Admin (acesso global)

**Funcionalidade:**
- Permite multi-usuário por tenant
- Super admins (role=3) têm acesso a todos os tenants
- Controla acesso ao painel administrativo

---

#### 3. `products` (Produtos)
Catálogo de produtos de cada tenant.

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants): Isolamento multi-tenant
- `category_id` (UUID, FK → categories, nullable)
- `name` (TEXT): Nome do produto
- `slug` (TEXT): URL-friendly name
- `sku` (TEXT, nullable): Código do produto
- `description` (TEXT, nullable): Descrição completa
- `price` (NUMERIC, nullable): Preço (pode ser "consulte")
- `image_url` (TEXT, nullable): URL da imagem principal
- `min_quantity` (INTEGER, default 1): Quantidade mínima
- `stock_control_enabled` (BOOLEAN): Se controla estoque
- `stock_quantity` (INTEGER): Quantidade em estoque
- `featured` (BOOLEAN): Se aparece em destaque
- `active` (BOOLEAN): Se está visível na vitrine

**RLS Policies:**
- `SELECT`: Qualquer um pode ver produtos ativos OU donos do tenant veem tudo
- `INSERT/UPDATE/DELETE`: Apenas owners/admins do tenant

---

#### 4. `categories` (Categorias)
Organização de produtos por categorias.

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `name` (TEXT): Nome da categoria
- `slug` (TEXT): URL-friendly name
- `description` (TEXT, nullable)
- `active` (BOOLEAN)

**RLS Policies:**
- Similar aos produtos (público para visualizar ativos, owners para gerenciar)

---

#### 5. `banners` (Banners da Vitrine)
Sistema de carrossel de banners na página inicial da vitrine.

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `title` (TEXT, nullable): Título do banner
- `subtitle` (TEXT, nullable): Subtítulo
- `image_url` (TEXT, nullable): URL da imagem
- `link` (TEXT, nullable): Link de destino (se clicar)
- `order_position` (INTEGER): Ordem de exibição
- `active` (BOOLEAN)

**Funcionalidade:**
- Carrossel automático (troca a cada 4 segundos)
- Banner padrão usado se nenhum configurado
- Ordenação por `order_position`

---

#### 6. `quotes` (Orçamentos)
Pedidos de orçamento gerados pelos clientes na vitrine.

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `customer_name` (TEXT): Nome do cliente
- `customer_email` (TEXT, nullable): E-mail do cliente
- `customer_whatsapp` (TEXT): WhatsApp do cliente
- `observations` (TEXT, nullable): Observações adicionais
- `message_text` (TEXT): Mensagem formatada para WhatsApp
- `status` (TEXT, default 'pending'): Status do orçamento
  - `pending`, `em análise`, `respondido`, `concluído`

**Relacionamentos:**
- 1:N com `quote_items` (produtos do orçamento)

**RLS Policies:**
- `INSERT`: Qualquer um pode criar (público)
- `SELECT`: Apenas owners do tenant podem visualizar

---

#### 7. `quote_items` (Itens do Orçamento)
Produtos específicos dentro de cada orçamento.

**Campos principais:**
- `id` (UUID, PK)
- `quote_id` (UUID, FK → quotes)
- `product_id` (UUID, FK → products, nullable)
- `product_name` (TEXT): Nome do produto (snapshot)
- `sku` (TEXT, nullable): SKU do produto (snapshot)
- `quantity` (INTEGER): Quantidade solicitada
- `price` (NUMERIC, nullable): Preço no momento (snapshot)

**Funcionalidade:**
- Snapshot dos dados do produto no momento do orçamento
- Preserva histórico mesmo se produto for alterado/deletado

---

#### 8. `plans` (Planos de Assinatura)
Planos disponíveis para assinatura no sistema.

**Campos principais:**
- `id` (UUID, PK)
- `name` (TEXT): Nome do plano (ex: "Free", "Essencial", "Pro")
- `slug` (TEXT, UNIQUE): Identificador URL-friendly
- `description` (TEXT, nullable): Descrição do plano
- `price_cents` (INTEGER): Preço em centavos (ex: 4990 = R$ 49,90)
- `max_products` (INTEGER, default -1): Limite de produtos (-1 = ilimitado)
- `trial_days` (INTEGER, default 0): Dias de trial gratuito
- `features` (JSONB): Lista de features incluídas
- `active` (BOOLEAN): Se o plano está disponível

**Planos Padrão:**
- **Free**: R$ 0,00, 10 produtos, sem trial
- **Essencial**: R$ 49,90, 50 produtos, 7 dias de trial
- **Pro**: R$ 129,00, produtos ilimitados, 7 dias de trial

---

#### 9. `subscriptions` (Assinaturas)
Assinatura ativa de cada tenant.

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants, UNIQUE): 1:1 com tenant
- `plan_id` (UUID, FK → plans): Plano atual
- `status` (TEXT): Status da assinatura
  - `trial` = Em período de teste
  - `active` = Assinatura ativa
  - `past_due` = Vencida
  - `canceled` = Cancelada
- `started_at` (TIMESTAMP): Início da assinatura
- `trial_ends_at` (TIMESTAMP, nullable): Fim do período de trial
- `payment_confirmed` (BOOLEAN): Se o pagamento foi confirmado
- `payment_date` (TIMESTAMP, nullable): Data do último pagamento

**Funcionalidade:**
- Bloqueia acesso à vitrine se `status = 'past_due'`
- Controla limite de produtos baseado em `plan_id.max_products`

---

#### 10. `store_settings` (Configurações da Loja)
Configurações visuais e funcionais de cada vitrine.

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants, UNIQUE)
- `branding` (JSONB): Identidade visual
  ```json
  {
    "store_title": "Minha Loja",
    "primary_color": "#F97316",
    "logo_url": "https://...",
    "favicon_url": "https://..."
  }
  ```
- `storefront` (JSONB): Configurações da vitrine
  ```json
  {
    "product_card_style": "classic",
    "listing_columns": 3,
    "banner_style": "carousel",
    "show_whatsapp_button": true,
    "navbar_style": "fixed",
    "footer_text": "© 2025 Minha Loja"
  }
  ```
- `contact` (JSONB): Informações de contato
  ```json
  {
    "email": "contato@loja.com",
    "whatsapp_number": "5511999999999"
  }
  ```
- `theme_id` (UUID, FK → themes, nullable): Tema visual aplicado

---

#### 11. `themes` (Temas Visuais)
Temas pré-configurados para personalizar a aparência da vitrine.

**Campos principais:**
- `id` (UUID, PK)
- `name` (TEXT): Nome do tema (ex: "Classic White", "Dark Modern")
- `slug` (TEXT, UNIQUE): Identificador
- `type` (TEXT): Tipo (global/custom)
- `description` (TEXT, nullable): Descrição do tema
- `thumbnail_url` (TEXT, nullable): Preview do tema
- `colors` (JSONB): Paleta de cores
  ```json
  {
    "primary": "20 14.3% 4.1%",
    "background": "0 0% 100%",
    "foreground": "20 14.3% 4.1%"
  }
  ```
- `config` (JSONB): Configurações visuais
  ```json
  {
    "grid": {
      "columns": { "mobile": 1, "tablet": 2, "desktop": 3 }
    }
  }
  ```
- `is_premium` (BOOLEAN): Se é tema premium (planos pagos)
- `active` (BOOLEAN): Se está disponível

**Temas Padrão:**
- Classic White
- Dark Modern
- Candy Soft

---

#### 12. `analytics_events` (Eventos de Analytics)
Rastreamento de comportamento dos visitantes na vitrine.

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `event_type` (TEXT): Tipo de evento
  - `page_view` = Visita à vitrine
  - `product_view` = Visualização de produto
  - `whatsapp_click` = Clique no WhatsApp
  - `quote_created` = Orçamento criado
- `product_id` (UUID, FK → products, nullable)
- `meta` (JSONB): Metadados adicionais
- `ip_address` (TEXT, nullable): IP do visitante
- `user_agent` (TEXT, nullable): User agent do navegador

**RLS Policies:**
- `INSERT`: Qualquer um pode inserir (público)
- `SELECT`: Apenas owners do tenant ou super admins

---

#### 13. `notifications` (Notificações Internas)
Sistema de notificações para os tenants.

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `type` (TEXT): Tipo de notificação
  - `trial_expiring` = Trial expirando
  - `payment_required` = Pagamento pendente
  - `limit_reached` = Limite de produtos atingido
- `message` (TEXT): Mensagem da notificação
- `read` (BOOLEAN, default false): Se foi lida

**Funcionalidade:**
- Badge no painel mostrando notificações não lidas
- Lista ordenada por data (mais recentes primeiro)

---

#### 14. `admin_logs` (Logs Administrativos)
Auditoria de ações administrativas no sistema.

**Campos principais:**
- `id` (UUID, PK)
- `action` (TEXT): Ação realizada (ex: "theme.apply", "tenant.suspend")
- `user_id` (UUID, nullable): Quem fez a ação
- `tenant_id` (UUID, FK → tenants, nullable): Tenant afetado
- `meta` (JSONB): Metadados da ação

**RLS Policies:**
- `INSERT`: Sistema pode inserir
- `SELECT`: Apenas super admins

---

#### 15. `email_notifications_sent` (Controle de E-mails)
Rastreamento de e-mails enviados para evitar duplicatas.

**Campos principais:**
- `id` (UUID, PK)
- `tenant_id` (UUID, FK → tenants)
- `user_email` (TEXT): E-mail do destinatário
- `notification_type` (TEXT): Tipo de notificação
- `days_before_expiry` (INTEGER): Dias antes do vencimento
- `expiry_date` (TIMESTAMP): Data de expiração
- `sent_at` (TIMESTAMP): Quando foi enviado

**Funcionalidade:**
- Evita enviar o mesmo e-mail múltiplas vezes
- Controle de e-mails de trial expirando (7, 3, 1 dias antes)

---

## 🔒 Segurança e Isolamento Multi-Tenant

### Row Level Security (RLS)

Todas as tabelas principais possuem políticas RLS que garantem isolamento entre tenants:

**Exemplo: Produtos**
```sql
-- Visualização pública
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (active = true OR EXISTS (
  SELECT 1 FROM tenant_memberships
  WHERE tenant_memberships.tenant_id = products.tenant_id
  AND tenant_memberships.user_id = auth.uid()
));

-- Gerenciamento
CREATE POLICY "Tenant owners can manage products"
ON products FOR ALL
USING (EXISTS (
  SELECT 1 FROM tenant_memberships
  WHERE tenant_memberships.tenant_id = products.tenant_id
  AND tenant_memberships.user_id = auth.uid()
  AND tenant_memberships.role >= 1
));
```

### Níveis de Acesso

1. **Público (Visitantes)**:
   - Visualizar produtos ativos
   - Visualizar categorias ativas
   - Visualizar banners ativos
   - Criar orçamentos

2. **Tenant Owner (role >= 1)**:
   - CRUD completo de produtos/categorias/banners
   - Visualizar orçamentos recebidos
   - Configurar loja
   - Visualizar analytics

3. **Super Admin (role = 3)**:
   - Acesso a todos os tenants
   - Gerenciar usuários
   - Gerenciar planos
   - Visualizar todos os logs
   - Suspender/ativar tenants

---

## 🛣️ Rotas da Aplicação

### Rotas Públicas

- `/` - Landing page (home pública)
- `/auth` - Login e registro
- `/reset-password` - Recuperação de senha
- `/loja/:slug` - Vitrine pública de uma loja
- `/loja/:slug/carrinho` - Página do carrinho/orçamento

### Rotas Protegidas

- `/dashboard` - Painel do tenant (requer autenticação)
- `/superadmin` - Painel de super admin (requer role=3)

### Proteção de Rotas

**Frontend:**
- Hook `useAuth()` verifica sessão
- Hook `useSuperAdmin()` verifica role=3
- Redirecionamento automático se não autorizado

**Backend (Edge Functions):**
- Verificação de JWT token
- Validação de `tenant_id` nas requisições
- Verificação de role para endpoints de super admin

---

## 🔧 Edge Functions (Backend Serverless)

### Autenticação

#### `auth-forgot-password`
- **Método**: POST
- **Body**: `{ email }`
- **Funcionalidade**: Envia e-mail de recuperação de senha
- **Público**: Sim

#### `auth-resend-confirmation`
- **Método**: POST
- **Body**: `{ email }`
- **Funcionalidade**: Reenvia e-mail de confirmação
- **Público**: Sim

#### `auth-welcome-email`
- **Método**: POST (webhook)
- **Trigger**: `auth.users` INSERT
- **Funcionalidade**: Envia e-mail de boas-vindas após confirmação
- **Público**: Sim (webhook interno)

---

### Gerenciamento de Tenant

#### `tenant-domain`
- **Métodos**: GET, POST
- **Autenticação**: Sim
- **Funcionalidade**:
  - GET: Retorna domínio customizado
  - POST: Salva domínio customizado

#### `tenant-upload-logo`
- **Método**: POST (multipart/form-data)
- **Autenticação**: Sim
- **Funcionalidade**: Upload de logo para `store-logos` bucket

#### `tenant-contact`
- **Método**: GET
- **Query**: `tenant_id`
- **Funcionalidade**: Retorna WhatsApp e configurações de contato
- **Público**: Sim

#### `tenant-select-theme`
- **Método**: POST
- **Body**: `{ theme_id, is_preview }`
- **Funcionalidade**: Aplica tema na vitrine

#### `tenant-plan-usage`
- **Método**: GET
- **Autenticação**: Sim
- **Funcionalidade**: Retorna uso atual do plano (produtos/limite)

---

### Storefront (Vitrine Pública)

#### `storefront-categories`
- **Método**: GET
- **Query**: `tenant_id`
- **Funcionalidade**: Lista categorias ativas
- **Público**: Sim

#### `storefront-search`
- **Método**: GET
- **Query**: `tenant_id`, `q` (termo de busca)
- **Funcionalidade**: Busca produtos por nome, SKU, descrição
- **Público**: Sim

#### `storefront-top-products`
- **Método**: GET
- **Query**: `tenant_id`, `limit`
- **Funcionalidade**: Retorna produtos em destaque
- **Público**: Sim

---

### Analytics

#### `analytics-log-event`
- **Método**: POST
- **Body**: `{ tenantId, eventType, productId?, meta? }`
- **Funcionalidade**: Registra evento de analytics
- **Público**: Sim

#### `analytics-reports`
- **Método**: GET
- **Query**: `tenant_id`, `start_date`, `end_date`, `report_type`
- **Funcionalidade**: Retorna relatórios agregados
- **Autenticação**: Sim

---

### Super Admin

#### `superadmin-dashboard`
- **Método**: GET
- **Autenticação**: Sim (role=3)
- **Funcionalidade**: Retorna métricas gerais do sistema

#### `superadmin-tenants`
- **Métodos**: GET, PUT
- **Autenticação**: Sim (role=3)
- **Funcionalidade**:
  - GET: Lista todos os tenants
  - PUT: Atualiza status/plano de um tenant

#### `superadmin-users`
- **Métodos**: GET, POST, PUT
- **Autenticação**: Sim (role=3)
- **Funcionalidade**:
  - GET: Lista usuários
  - POST: Cria usuário
  - PUT: Atualiza usuário (ativa/desativa, reseta senha)

#### `superadmin-plans`
- **Métodos**: GET, POST, PUT, DELETE
- **Autenticação**: Sim (role=3)
- **Funcionalidade**: CRUD completo de planos

#### `superadmin-logs`
- **Método**: GET
- **Query**: `limit`, `offset`, `action_filter`
- **Autenticação**: Sim (role=3)
- **Funcionalidade**: Retorna logs administrativos

---

## 📧 Sistema de E-mails

### Templates Implementados

1. **confirm-email.html**
   - Quando: Registro de novo usuário
   - Conteúdo: Link de confirmação de e-mail
   - Serviço: Resend

2. **welcome-email.html**
   - Quando: Após confirmação de e-mail (webhook)
   - Conteúdo: Boas-vindas + checklist de setup
   - Serviço: Resend

3. **reset-password.html**
   - Quando: Solicitação de recuperação de senha
   - Conteúdo: Link de reset (válido por 60 minutos)
   - Serviço: Resend

4. **trial-expiring.html** (futuro)
   - Quando: 7, 3, 1 dias antes do fim do trial
   - Conteúdo: Alerta de expiração + link para upgrade

---

## 🎨 Sistema de Temas

### Aplicação de Temas

Temas são aplicados via CSS variables injetadas no `:root`:

```css
:root {
  --primary: 20 14.3% 4.1%;
  --background: 0 0% 100%;
  --foreground: 20 14.3% 4.1%;
  /* ... outras variáveis ... */
}
```

### Preview de Temas

- Usuário pode visualizar tema antes de aplicar
- Preview temporário salvo em `tenants.theme_preview_id`
- Ao aplicar definitivamente, move para `tenants.selected_theme_id`
- Salva tema anterior em `tenants.previous_theme_id` para permitir reverter

---

## 🛒 Fluxo do Orçamento

### 1. Cliente Navega na Vitrine
- Acessa `/loja/:slug`
- Vê produtos, categorias, banners

### 2. Adiciona Produtos ao Carrinho
- Clica em "Adicionar"
- Produtos salvos no Zustand (localStorage)
- Badge do carrinho atualiza

### 3. Vai para Página do Carrinho
- Acessa `/loja/:slug/carrinho`
- Revisa produtos
- Ajusta quantidades

### 4. Preenche Dados
- Nome (obrigatório)
- E-mail (opcional)
- WhatsApp (obrigatório)
- Observações (opcional)

### 5. Envia Orçamento
- Sistema formata mensagem WhatsApp
- Salva `quote` no banco
- Salva `quote_items` associados
- Registra evento `quote_created` em analytics
- Abre WhatsApp com mensagem pré-preenchida
- Limpa carrinho
- Redireciona para vitrine

### Formato da Mensagem WhatsApp

```
*Novo Orçamento*

*Cliente:* João Silva
*Email:* joao@email.com
*WhatsApp:* 5511999999999

*Produtos:*
- Produto A (x2) - R$ 199,80
- Produto B (x1) - R$ 49,90

*Observações:* Preciso para entrega até sexta-feira.
```

---

## 📈 Sistema de Analytics

### Eventos Rastreados

1. **page_view**: Visita à vitrine
2. **product_view**: Visualização de produto específico
3. **whatsapp_click**: Clique no botão de WhatsApp
4. **quote_created**: Orçamento finalizado

### Relatórios Disponíveis

- Total de visitas por período
- Produtos mais visualizados
- Taxa de conversão (visitas → orçamentos)
- Cliques no WhatsApp

### Dashboard de Analytics

Exibido na aba "Analytics" do painel do tenant, mostra:
- Gráficos de visitas ao longo do tempo
- Top 10 produtos mais visualizados
- Total de orçamentos gerados
- Cliques no WhatsApp

---

## ⚙️ Configurações da Loja

### Aba Identidade

- **Nome da Loja**: Exibido no header e SEO
- **Logo**: Upload de imagem (PNG, JPG, WebP)
- **Cor Primária**: Cor da marca (hex)

### Aba Contato

- **E-mail**: Contato comercial
- **WhatsApp**: Número para orçamentos
- **Exibir Botão Flutuante**: Toggle para botão de WhatsApp

### Aba Vitrine

- **Colunas de Grid**: Desktop, tablet, mobile
- **Estilo de Card**: Classic, modern, minimal
- **Texto do Rodapé**: Copyright customizado

### Aba Temas

- Preview visual dos temas disponíveis
- Aplicar tema com um clique
- Reverter para tema anterior

### Aba Domínio

- Configurar domínio personalizado
- Instruções de DNS (CNAME)
- Status de verificação (🔴 não verificado, 🟢 ativo)

---

## 🔐 Sistema de Planos e Assinaturas

### Controle de Limites

**Verificação antes de criar produto:**
```typescript
// Endpoint: check-product-limit
if (plan.max_products !== -1 && currentCount >= plan.max_products) {
  return { canCreate: false, error: 'Limite atingido' };
}
```

### Expiração de Trial

**Fluxo automático:**
1. Usuário se cadastra → `trial_ends_at = now() + 7 days`
2. Sistema verifica diariamente (cron job futuro)
3. Se `trial_ends_at < now()`:
   - `subscription.status = 'past_due'`
   - `tenant.active = false`
   - Vitrine pública bloqueada
   - Notificação criada
   - E-mail enviado

### Reativação Manual (Super Admin)

Super admin pode:
- Estender trial (+30/60/365 dias)
- Confirmar pagamento manualmente
- Trocar plano do tenant
- Suspender/ativar manualmente

---

## 🚀 Fluxo de Onboarding

### 1. Cadastro
- Usuário preenche formulário
- Sistema envia e-mail de confirmação
- **NÃO** loga automaticamente

### 2. Confirmação de E-mail
- Usuário clica no link do e-mail
- Webhook `auth.users` INSERT é disparado
- Edge function `auth-welcome-email` envia boas-vindas

### 3. Criação Automática de Tenant
- Trigger `handle_new_user_tenant_setup` cria:
  - Tenant com slug único
  - Membership (role=2, owner)
  - Subscription no plano Free
  - Store settings padrão
  - Dados demo (3 produtos, 3 categorias, 1 banner)

### 4. Primeiro Login
- Usuário faz login
- Redirecionado para `/dashboard`
- Vê tutorial de primeiros passos

---

## 🎛️ Painel Super Admin

### Dashboard Principal

**Métricas:**
- Total de tenants
- Tenants ativos vs suspensos
- Total de produtos no sistema
- Total de orçamentos
- Total de usuários

### Aba Tenants

**Listagem:**
- Nome da empresa
- Slug
- Plano atual
- Status da assinatura
- Data de expiração

**Ações:**
- Suspender/ativar
- Trocar plano
- Regenerar slug
- Visualizar detalhes

### Aba Usuários

**Listagem:**
- Nome, e-mail
- Tenant associado
- Plano
- Status (trial/active/past_due)
- Data de expiração

**Ações:**
- Resetar senha
- Estender acesso (+30/60/365 dias)
- Suspender/ativar
- Trocar plano

### Aba Planos

**CRUD Completo:**
- Criar novo plano
- Editar existente
- Ativar/desativar
- Definir features
- Definir limites

### Aba Logs

**Auditoria:**
- Todas as ações administrativas
- Filtros por:
  - Tipo de ação
  - Usuário
  - Tenant
  - Data
- Exibição de metadados JSON

---

## 🎨 Vitrine Pública - Componentes

### Header Moderno

**Elementos:**
- Logo da loja (ou placeholder)
- Menu de navegação:
  - Home
  - Produtos (dropdown com categorias)
- Ícones de ação:
  - WhatsApp (se configurado)
  - Carrinho (com badge de quantidade)

**Responsividade:**
- Desktop: menu horizontal completo
- Mobile: hamburger menu (futuro)

### Carrossel de Banners

- Troca automática a cada 4 segundos
- Indicadores de posição clicáveis
- Título e subtítulo sobrepostos
- Fallback para banner padrão

### Grade de Produtos

- Layout responsivo baseado em `theme.config.grid`
- Cards com imagem, nome, preço, botão
- Fallback para imagem padrão
- Badge "Em destaque" para produtos featured

### Botão Flutuante de WhatsApp

- Fixo no canto inferior direito
- Abre WhatsApp com mensagem padrão
- Controlado por toggle em Configurações

---

## 🔄 Webhooks e Integrações

### Supabase Webhooks Configurados

1. **auth.users → INSERT**
   - Trigger: Novo usuário confirmado
   - Endpoint: `auth-welcome-email`
   - Ação: Envia e-mail de boas-vindas

### Resend (E-mails Transacionais)

**Configuração:**
- Secret: `RESEND_API_KEY`
- Remetente: `no-reply@catalogo-virtual.com`

**Templates:**
- Confirmação de e-mail
- Boas-vindas
- Reset de senha
- Trial expirando (futuro)

### WhatsApp Business API

**Método:**
- Deep link: `https://api.whatsapp.com/send?phone={number}&text={message}`
- Não requer API key
- Funciona em desktop e mobile

---

## 📂 Estrutura de Pastas

```
/
├── src/
│   ├── components/
│   │   ├── ui/                   # Componentes Shadcn
│   │   ├── dashboard/            # Componentes do painel
│   │   ├── storefront/           # Componentes da vitrine
│   │   └── superadmin/           # Componentes do super admin
│   ├── hooks/                    # React hooks customizados
│   │   ├── useAuth.ts
│   │   ├── useTenant.ts
│   │   ├── useCart.ts
│   │   ├── useTheme.ts
│   │   └── useSuperAdmin.ts
│   ├── pages/                    # Páginas principais
│   │   ├── Index.tsx             # Landing page
│   │   ├── Auth.tsx              # Login/registro
│   │   ├── Dashboard.tsx         # Painel do tenant
│   │   ├── SuperAdmin.tsx        # Painel super admin
│   │   ├── Storefront.tsx        # Vitrine pública
│   │   ├── Cart.tsx              # Carrinho/orçamento
│   │   └── ResetPassword.tsx     # Reset de senha
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts         # Cliente Supabase
│   │       └── types.ts          # Tipos TypeScript (auto-gerado)
│   ├── types/
│   │   └── database.ts           # Tipos do banco
│   ├── lib/
│   │   └── utils.ts              # Utilitários
│   ├── App.tsx                   # Router principal
│   └── main.tsx                  # Entry point
│
├── supabase/
│   ├── functions/                # Edge functions
│   │   ├── auth-*/
│   │   ├── tenant-*/
│   │   ├── storefront-*/
│   │   ├── analytics-*/
│   │   └── superadmin-*/
│   ├── migrations/               # SQL migrations
│   └── config.toml               # Configuração Supabase
│
├── public/
│   └── images/
│       ├── default-product-512.png
│       └── default-banner-2560x1440.png
│
└── docs/                         # Documentação (este arquivo)
```

---

## 🔧 Variáveis de Ambiente

### Frontend (`.env` não usado - valores hardcoded)
- `SUPABASE_URL`: URL do projeto Supabase
- `SUPABASE_ANON_KEY`: Chave pública do Supabase

### Backend (Secrets do Supabase)
- `SUPABASE_URL`: URL do projeto
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço (acesso total)
- `SUPABASE_ANON_KEY`: Chave pública
- `RESEND_API_KEY`: Chave da API Resend

---

## 🚨 Troubleshooting Comum

### "Loja não encontrada"
- **Causa**: Slug não existe ou está inativo
- **Solução**: Verificar `tenants.slug` e `tenants.active`

### "Limite de produtos atingido"
- **Causa**: `plan.max_products` atingido
- **Solução**: Upgrade de plano ou deletar produtos

### "Vitrine não carrega"
- **Causa**: `subscription.status = 'past_due'` ou `tenant.active = false`
- **Solução**: Renovar assinatura ou super admin reativar

### "Imagens não aparecem"
- **Causa**: Bucket não público ou URL inválida
- **Solução**: Verificar RLS do bucket `store-logos`

### "Orçamento não chega"
- **Causa**: WhatsApp não configurado
- **Solução**: Configurar `tenants.whatsapp_number` ou `store_settings.contact.whatsapp_number`

---

## 📚 Recursos Adicionais

### Documentação Externa
- [Supabase Docs](https://supabase.com/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Shadcn/ui Docs](https://ui.shadcn.com)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Resend Docs](https://resend.com/docs)

### Suporte
- E-mail: suporte@catalogo-virtual.com
- Discord: [Link do servidor]
- Documentação: `/docs`

---

**Última atualização:** 24/11/2025  
**Versão do sistema:** 1.0.0  
**Autor:** Equipe Catálogo Virtual

# SaaS Vitrine + Orçamentos WhatsApp - Setup

## Pré-requisitos
- Node.js 16+ e npm
- Projeto Supabase criado (já configurado neste repo)

## Instalação

```bash
# 1. Instalar dependências
npm install

# 2. Variáveis de ambiente já configuradas em .env
# VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY

# 3. Migrations já foram executadas no Supabase
# Tabelas criadas: tenants, categories, products, banners, quotes, quote_items, store_settings, tenant_memberships
```

## Executar Localmente

```bash
npm run dev
```

Acesse: http://localhost:8080

## Estrutura do Banco

### Tabelas Principais

- **tenants**: Lojas/clientes (multi-tenant)
- **categories**: Categorias de produtos
- **products**: Catálogo de produtos
  - **Novos campos**: `stock_control_enabled`, `stock_quantity`
- **product_images**: Múltiplas imagens por produto (ordenadas)
- **product_variations**: Variações de produtos (cor, tamanho, etc)
- **banners**: Banners da vitrine
- **quotes**: Orçamentos recebidos
- **quote_items**: Itens dos orçamentos
- **store_settings**: Configurações da loja (WhatsApp, tema, etc)
- **tenant_memberships**: Relacionamento usuários/lojas (roles)
- **themes**: Temas disponíveis para vitrines (Free e Pro)
- **plans**: Planos de assinatura (Free, Essencial, Pro)
- **subscriptions**: Assinaturas dos tenants
- **admin_logs**: Logs de auditoria do super admin
- **analytics_events**: Eventos de analytics (page_view, product_view, etc)
- **notifications**: Notificações do sistema

### RLS (Row Level Security)

Todas as tabelas têm RLS habilitado. Políticas configuradas:
- Produtos/categorias/banners públicos podem ser lidos por todos
- Owners de tenants podem gerenciar seus dados
- Clientes podem criar quotes (público)

## IMPORTANTE: Configuração Inicial

### Desabilitar Confirmação de Email no Supabase

**OBRIGATÓRIO** para login imediato após registro:

1. Acesse: https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/auth/providers
2. Vá em **Authentication** → **Providers** → **Email**
3. **Desabilite** "Confirm email"
4. Salve

Ver `SIMPLIFIED_AUTH.md` para detalhes completos do fluxo simplificado.

## Fluxo de Uso

### 1. Cadastro Simplificado

1. Acesse `/auth`
2. Clique na aba "Criar Conta"
3. Preencha: Nome, Email, Senha (mín 6 caracteres)
4. Clique "Criar Conta"
5. **Sistema automaticamente**:
   - Cria usuário no Supabase Auth (senha criptografada)
   - Trigger cria tenant (loja) com slug único automático
   - Cria membership com role owner (2)
   - Popula categorias e produtos demo (se possível)
   - Cria store settings padrão
   - **Loga automaticamente** e redireciona para dashboard

**Observações**:
- Sem validações complexas
- Sem bloqueios
- Slug único garantido (adiciona número aleatório se conflitar)
- Se email já existe: erro "Email já cadastrado"
- Tenant sempre criado com `active=true`

### 2. Dashboard do Tenant

Acesse `/dashboard` após login:

- **Produtos**: CRUD completo (nome, SKU, preço, imagem, categoria, qtd min)
- **Categorias**: Criar/deletar categorias
- **Orçamentos**: Visualizar orçamentos recebidos com itens
- **Configurações**: Editar WhatsApp da loja, ver URL da vitrine

### 3. Vitrine Pública

URL: `/loja/{slug}`

- Lista produtos ativos com categorias
- Banners no topo (se houver)
- Botão "Adicionar ao Carrinho"
- Carrinho persistente (localStorage via zustand)

### 4. Carrinho e Orçamento

URL: `/loja/{slug}/carrinho`

1. Cliente vê produtos no carrinho
2. Pode ajustar quantidades (respeitando min_quantity)
3. Preenche: Nome, Email (opcional), WhatsApp, Observações
4. Ao enviar:
   - Cria `quote` no banco
   - Cria `quote_items` para cada produto
   - Gera mensagem formatada
   - Abre WhatsApp Web com link: `https://api.whatsapp.com/send?phone={whatsapp_loja}&text={mensagem}`
   - Limpa carrinho
   - Redireciona para loja

## Roles (tenant_memberships.role)

- `1` = Admin (pode gerenciar produtos/categorias)
- `2` = Owner (controle total)

## Seed de Dados

Ao criar conta, o trigger `handle_new_user_tenant_setup` popula automaticamente:

- 1 tenant com slug único
- 3 categorias: "Ofertas da Semana", "Lançamentos", "Mais Vendidos"
- 4 produtos demo com imagens do Unsplash
- 1 banner de boas-vindas
- Store settings padrão

## Configurar WhatsApp da Loja

1. Login no dashboard
2. Aba "Configurações"
3. Informar WhatsApp no formato: `5511999999999` (código país + DDD + número, sem +)
4. Salvar

**IMPORTANTE**: Sem WhatsApp configurado, orçamentos não podem ser enviados.

## Sistema de Autenticação

O sistema usa **Supabase Auth** para autenticação segura:

- Senhas criptografadas automaticamente (bcrypt)
- Tokens JWT para sessões
- Sessions persistem no localStorage
- RLS protege dados por tenant
- Logs de auth disponíveis no painel Supabase

Ver `SUPABASE_CONFIG.md` para detalhes de endpoints e configuração.

## Endpoints REST Exemplo

### Login (via Supabase SDK - recomendado)
```typescript
import { supabase } from "@/integrations/supabase/client";

const { data, error } = await supabase.auth.signInWithPassword({
  email: "user@example.com",
  password: "senha123"
});
```

### Login (REST direto)
```bash
curl -X POST https://rtljfxgxpgzabbsmqwno.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0bGpmeGd4cGd6YWJic21xd25vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzI4MDMsImV4cCI6MjA3NjY0ODgwM30.4OIrYaOYZ-FQ0sRgUIdJNIK6o5F-W6mAAG-iUmCcZGw" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"senha123"}'
```

### Criar Produto (requer auth)
```bash
curl -X POST https://rtljfxgxpgzabbsmqwno.supabase.co/rest/v1/products \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Authorization: Bearer {access_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid-do-tenant",
    "name": "Produto Teste",
    "slug": "produto-teste",
    "price": 99.90,
    "min_quantity": 1,
    "active": true
  }'
```

### Listar Produtos Públicos
```bash
curl https://rtljfxgxpgzabbsmqwno.supabase.co/rest/v1/products?tenant_id=eq.{tenant_id}&active=eq.true \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Criar Quote (público, não requer auth)
```bash
curl -X POST https://rtljfxgxpgzabbsmqwno.supabase.co/rest/v1/quotes \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "uuid-do-tenant",
    "customer_name": "Cliente Teste",
    "customer_whatsapp": "5511999999999",
    "observations": "Teste de orçamento"
  }'
```

## Tecnologias

- **Frontend**: React 18, TypeScript, Vite, TanStack Query, Zustand, shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Auth, Postgres, RLS)
- **Deploy**: Lovable (ou Vercel/Netlify)

## Troubleshooting

### Erro "new row violates row-level security policy"
- Verificar se usuário está autenticado
- Verificar se tenant_id está sendo passado corretamente
- Verificar se usuário tem membership no tenant

### WhatsApp não abre
- Verificar se WhatsApp foi configurado em Settings
- Formato correto: `5511999999999` (sem + ou espaços)
- Testar link manualmente: `https://api.whatsapp.com/send?phone=5511999999999&text=teste`

### Produtos não aparecem na vitrine
- Verificar se produtos estão com `active=true`
- Verificar se tenant slug está correto na URL
- Verificar RLS policies no Supabase

## Próximos Passos (Opcionais)

- [x] **Controle de estoque por produto** ✅
- [x] **Múltiplas imagens por produto** ✅
- [x] **Variações de produto (cor, tamanho)** ✅
- [x] **Endpoints de ativar/desativar e clonar produtos** ✅
- [x] **Sistema de planos e subscriptions** ✅
- [x] **Painel Super Admin com métricas** ✅
- [x] **Analytics e rastreamento de eventos** ✅
- [x] **Sistema de notificações** ✅
- [ ] Adicionar imagens via upload (Supabase Storage)
- [ ] Implementar busca/filtros de produtos
- [ ] Relatórios e analytics (frontend)
- [ ] Integração com gateway de pagamento
- [ ] Customização de tema/cores da vitrine

## 🔧 Funcionalidades PRO

### Planos e Subscriptions
O sistema agora possui 3 planos pré-configurados:

1. **Free** - R$ 0/mês
   - Até 10 produtos
   - Orçamentos ilimitados
   - WhatsApp integrado
   - Categorias ilimitadas
   - SEO básico
   - 1 banner
   - Suporte limitado

2. **Essencial** - R$ 49,90/mês
   - Até 50 produtos
   - Trial de 7 dias
   - Variações de produto
   - Múltiplas imagens
   - Analytics simplificado
   - Suporte prioritário

3. **Pro** - R$ 129,00/mês
   - Produtos ilimitados
   - Trial de 7 dias
   - Dashboard avançado
   - Kanban de orçamentos
   - Analytics completo
   - Relatórios exportáveis
   - Equipe (multiusuários)
   - Tema personalizável
   - Domínio próprio
   - Webhooks
   - Suporte premium

### Painel Super Admin (role = 3)

**Edge Functions disponíveis:**
- `/superadmin-dashboard` - Métricas gerais do sistema
- `/superadmin-tenants` - Gestão de lojas (suspender, reativar, alterar plano, regenerar slug)
- `/superadmin-logs` - Logs de auditoria com filtros
- `/superadmin-reset-password` - Resetar senha de usuários

Ver documentação completa em `SUPERADMIN_API.md`

**Métricas disponíveis:**
- Total de tenants (ativos/suspensos)
- Total de produtos
- Total de orçamentos
- Total de usuários
- Subscriptions por status

**Ações disponíveis:**
- Suspender/reativar loja
- Regenerar slug único
- Alterar plano do tenant
- Resetar senha de usuário
- Visualizar logs de auditoria

### Analytics
Tabela `analytics_events` para rastreamento:
- `page_view` - Visualização de página
- `product_view` - Visualização de produto
- `whatsapp_click` - Clique no botão WhatsApp
- `quote_created` - Orçamento criado

Cada evento captura:
- Tenant ID
- Produto ID (quando aplicável)
- IP do visitante
- User-Agent
- Metadata adicional (JSON)

### Notificações
Sistema de notificações automáticas:
- Trial expirando (2 dias antes)
- Loja suspensa
- Pagamento confirmado
- Limite de produtos atingido

Tabela `notifications` com:
- Tipo de notificação
- Mensagem
- Status de leitura
- Timestamp

### Sistema de Temas (Mobile-First)
O sistema possui 3 temas pré-configurados para vitrines:

**1. Free Classic** (Gratuito)
- Layout clássico simples
- Grid: 1 coluna mobile, 2 tablet, 3 desktop
- Tema padrão para novos tenants

**2. Essencial Clean** (Requer plano Essencial ou Pro)
- Layout minimalista e limpo
- Grid: 2 colunas mobile, 3 tablet, 4 desktop
- Features: Quick view, sticky add-to-cart

**3. Pro Premium** (Requer plano Pro)
- Layout premium com recursos avançados
- Grid: 2 colunas mobile, 3 tablet, 4 desktop (masonry)
- Features: Quick view, wishlist, comparação, filtros, animações

**Seleção de Tema:**
- Edge function: `/tenant-select-theme`
- Validação automática de plano
- Mobile-first com breakpoints responsivos
- Grid adaptável por dispositivo

Ver documentação completa em `THEMES_API.md`

## Novidades (PROMPT 1 - Produtos)

### Controle de Estoque
- Campo `stock_control_enabled` para habilitar/desabilitar controle
- Campo `stock_quantity` para quantidade em estoque

### Múltiplas Imagens
- Tabela `product_images` com ordenação via campo `position`
- RLS configurado para acesso público (leitura) e gerenciamento por owners

### Variações de Produto
- Tabela `product_variations` para cores, tamanhos, materiais, etc
- Suporte a ajuste de preço por variação
- Controle de estoque por variação
- SKU com sufixo (ex: SKU001-AZUL-M)

### Endpoints de API
**Edge Functions deployadas:**
- `/functions/v1/toggle-product`: Ativar/desativar produto
- `/functions/v1/clone-product`: Clonar produto (com imagens e variações)

Ver documentação completa em `PRODUCTS_API.md`

## Contato

Para dúvidas, abra uma issue no repositório.

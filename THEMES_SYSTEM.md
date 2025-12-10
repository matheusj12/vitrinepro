# Sistema de Temas - Documentação Completa

## Visão Geral

Sistema robusto de temas para vitrines multi-tenant com preview, apply, revert e auditoria completa. Implementado seguindo boas práticas SaaS com transações atômicas e rollback automático.

## Arquitetura

### Database Schema

#### Tabela: themes
```sql
CREATE TABLE public.themes (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id), -- NULL = tema global
  name TEXT NOT NULL,
  description TEXT,
  colors JSONB NOT NULL DEFAULT '{}',     -- CSS variables
  variables JSONB DEFAULT '{}',           -- Variáveis adicionais
  is_premium BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Colunas adicionadas em tenants:
- `selected_theme_id`: Tema atualmente aplicado
- `theme_preview_id`: Tema em preview (não persistido)
- `previous_theme_id`: Tema anterior (para rollback)

### Temas Globais Seeded

Três temas gratuitos com IDs fixos:

1. **Classic White** (`00000000-0000-0000-0000-000000000001`)
   - Cores: `#ff6a00` (primary), `#ffffff` (bg), `#222222` (text)
   - Estilo: Clássico e profissional

2. **Dark Modern** (`00000000-0000-0000-0000-000000000002`)
   - Cores: `#00e676` (primary), `#121212` (bg), `#f5f5f5` (text)
   - Estilo: Escuro e moderno

3. **Candy Soft** (`00000000-0000-0000-0000-000000000003`)
   - Cores: `#ff4fa3` (primary), `#fff8fb` (bg), `#333333` (text)
   - Estilo: Suave e doce

## Backend - Edge Functions

### GET /functions/v1/themes-list
**Descrição**: Lista todos os temas disponíveis para o tenant.

**Autenticação**: Opcional (se autenticado, retorna temas específicos do tenant)

**Response**:
```json
{
  "themes": [
    {
      "id": "uuid",
      "name": "Classic White",
      "description": "Tema clássico...",
      "colors": {
        "--primary": "#ff6a00",
        "--bg": "#ffffff",
        "--text": "#222222"
      },
      "is_premium": false,
      "is_allowed": true,
      "thumbnail_url": "/images/themes/classic-white.png"
    }
  ],
  "tenant_plan": "free"
}
```

**Lógica is_allowed**:
- Temas free: sempre `true`
- Temas premium: `true` apenas para planos Essencial/Pro

---

### POST /functions/v1/themes-apply
**Descrição**: Aplica ou faz preview de um tema.

**Autenticação**: Obrigatória (Bearer token)

**Body**:
```json
{
  "themeId": "uuid-do-tema",
  "preview": false
}
```

**Comportamento**:
- `preview: true`: Apenas salva em `theme_preview_id`, não altera tema ativo
- `preview: false`: Aplica tema definitivamente com auditoria

**Response (sucesso)**:
```json
{
  "success": true,
  "preview": false,
  "theme_id": "uuid-novo-tema",
  "previous_theme_id": "uuid-tema-anterior",
  "theme": {
    "id": "uuid",
    "name": "Dark Modern",
    "colors": {...}
  }
}
```

**Response (erro)**:
```json
{
  "success": false,
  "error": "Plano não permite usar este tema ou tema inativo"
}
```

**Validações**:
1. Usuário autenticado e membro do tenant
2. Tema existe e está ativo
3. Plano do tenant permite usar o tema (free vs premium)

**Auditoria**:
- Registra em `admin_logs` com action `theme.apply`
- Meta: `theme_before`, `theme_after`, `timestamp`

---

### POST /functions/v1/themes-revert
**Descrição**: Reverte para o tema anterior.

**Autenticação**: Obrigatória (Bearer token)

**Body**: Vazio (usa previous_theme_id automaticamente)

**Response**:
```json
{
  "success": true,
  "theme_id": "uuid-tema-revertido"
}
```

**Validações**:
- `previous_theme_id` não pode ser NULL

**Auditoria**:
- Registra em `admin_logs` com action `theme.revert`

## Frontend - Dashboard

### Componente: ThemesManager

**Localização**: `/dashboard` → Tab "Aparência"

**Funcionalidades**:

1. **Listagem de Temas**
   - Grid responsivo com cards de temas
   - Separação visual: "Temas Gratuitos" e "Temas Premium"
   - Thumbnails de cada tema
   - Indicador visual do tema atual

2. **Preview Seguro**
   - Botão "Preview" aplica tema apenas no cliente
   - Não persiste no banco até confirmação
   - Mostra banner de confirmação no topo
   - Permite testar antes de aplicar

3. **Aplicação de Tema**
   - Botão "Aplicar" persiste tema no banco
   - Transação atômica com rollback automático em caso de erro
   - Toast de sucesso/erro
   - Atualização imediata da interface

4. **Revert (Desfazer)**
   - Botão "Desfazer Última Mudança" no topo da página
   - Disponível apenas se houver `previous_theme_id`
   - Confirmação antes de reverter
   - Auditoria completa

5. **Gating por Plano**
   - Temas premium mostram badge "Upgrade necessário" para planos free
   - Botão desabilitado com ícone de cadeado
   - Tooltip explicativo

6. **UI Features**
   - Color swatches mostrando paleta de cores
   - Thumbnail de cada tema
   - Badges: "Atual", "Premium", "Bloqueado"
   - Animações e hover effects

### Hook: useTheme

**Localização**: `src/hooks/useTheme.ts`

**Uso**:
```typescript
import { useTheme } from "@/hooks/useTheme";

const MyComponent = () => {
  const { theme, isLoading, applyTheme, clearTheme } = useTheme(tenantId);
  
  // Tema é automaticamente aplicado via CSS variables
  return <div>Tema ativo: {theme?.name}</div>;
};
```

**Funcionalidades**:
- Carrega tema selecionado do tenant
- Aplica CSS variables automaticamente em `document.documentElement`
- Cleanup ao desmontar
- Métodos helper para preview manual

**CSS Variables Aplicadas**:
```css
:root {
  --primary: #ff6a00;
  --bg: #ffffff;
  --text: #222222;
  --card-bg: #f8f9fa;
  --border: #e0e0e0;
}
```

## Integração na Vitrine Pública

A vitrine (`src/pages/Storefront.tsx`) automaticamente:
1. Carrega o tema do tenant via `useTheme(tenant?.id)`
2. Aplica CSS variables em tempo real
3. Fallback para tema padrão se não houver tema selecionado

Não altera layout, apenas cores/variáveis visuais.

## Segurança

### RLS Policies

1. **SELECT**: Qualquer um pode ver temas globais ativos ou temas do próprio tenant
2. **INSERT**: Apenas membros do tenant (role >= 1) podem criar temas para seu tenant
3. **UPDATE**: Apenas membros podem atualizar temas do tenant
4. **ALL**: Super admins (role = 3) podem gerenciar todos os temas

### Função: can_use_theme(tenant_id, theme_id)
Valida se tenant pode usar o tema baseado no plano:
- Temas free: sempre permitido
- Temas premium: apenas Essencial/Pro

### Transações Atômicas
Função `apply_theme` usa transação implícita e exception handling:
- Em caso de erro, retorna JSON com `success: false`
- Não corrompe estado do banco
- Registra auditoria apenas em caso de sucesso

## Auditoria e Logs

Todas as ações são registradas em `admin_logs`:

```sql
-- Exemplo de log
{
  "action": "theme.apply",
  "user_id": "uuid-usuario",
  "tenant_id": "uuid-tenant",
  "meta": {
    "theme_before": "uuid-antigo",
    "theme_after": "uuid-novo",
    "timestamp": "2025-11-24T02:43:00Z"
  }
}
```

Ações auditadas:
- `theme.apply`: Quando tema é aplicado
- `theme.revert`: Quando tema é revertido

## Rollback e Disaster Recovery

### Rollback de Migration
```sql
-- 1. Remover funções
DROP FUNCTION IF EXISTS public.revert_theme(UUID, UUID);
DROP FUNCTION IF EXISTS public.apply_theme(UUID, UUID, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS public.can_use_theme(UUID, UUID);

-- 2. Remover colunas de tenants
ALTER TABLE public.tenants 
  DROP COLUMN IF EXISTS selected_theme_id,
  DROP COLUMN IF EXISTS theme_preview_id,
  DROP COLUMN IF EXISTS previous_theme_id;

-- 3. Remover colunas adicionadas em themes
ALTER TABLE public.themes
  DROP COLUMN IF EXISTS tenant_id,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS colors,
  DROP COLUMN IF EXISTS variables,
  DROP COLUMN IF EXISTS is_premium,
  DROP COLUMN IF EXISTS thumbnail_url,
  DROP COLUMN IF EXISTS created_by,
  DROP COLUMN IF EXISTS updated_at;
```

### Desfazer Tema em Produção
1. Usuário clica "Desfazer Última Mudança"
2. Sistema chama `revert_theme()`
3. Tema anterior é restaurado
4. CSS variables são atualizadas no cliente
5. Auditoria registra a ação

### Emergency Rollback
Se sistema de temas causar problemas:
```sql
-- Desativar todos temas premium
UPDATE public.themes SET is_active = false WHERE is_premium = true;

-- Forçar todos tenants para tema padrão
UPDATE public.tenants SET selected_theme_id = '00000000-0000-0000-0000-000000000001';
```

## Fluxo do Usuário

### Aplicar Tema
1. Acessa Dashboard → Aparência
2. Vê grid de temas (free + premium)
3. Clica "Preview" em um tema
   - CSS variables aplicadas imediatamente no cliente
   - Banner de confirmação aparece no topo
4. Clica "Aplicar" para confirmar
   - Tema persistido no banco
   - Auditoria registrada
   - Toast de sucesso
5. Vitrine pública já exibe novo tema

### Desfazer Tema
1. Nota que não gostou do tema aplicado
2. Clica "Desfazer Última Mudança" (disponível por tempo indeterminado)
3. Confirma a ação
4. Tema anterior é restaurado
5. Toast de sucesso

## Performance

- **CSS Variables**: Aplicação instantânea sem reload
- **Query Caching**: React Query cacheia temas por 5 minutos
- **Lazy Loading**: Thumbnails carregadas sob demanda
- **Índices DB**: `tenant_id`, `is_premium`, `is_active`, `selected_theme_id`

## Planos e Gating

| Plano | Temas Free | Temas Premium | Criar Temas Próprios |
|-------|-----------|---------------|---------------------|
| Free | ✅ | ❌ | ❌ |
| Essencial | ✅ | ✅ | ❌ |
| Pro | ✅ | ✅ | ✅ (futuro) |

## Próximas Melhorias

1. **Editor de Tema Custom** (Pro)
   - Color pickers para criar temas personalizados
   - Preview em tempo real
   - Salvar como tema do tenant

2. **Agendamento de Temas**
   - Aplicar tema automaticamente em datas específicas
   - Ex: Black Friday, Natal, etc.

3. **A/B Testing**
   - Testar dois temas simultaneamente
   - Métricas de conversão por tema

4. **Importar/Exportar Temas**
   - JSON export de configurações
   - Compartilhar temas entre tenants (marketplace?)

5. **Tema por Dispositivo**
   - Tema diferente para mobile vs desktop
   - Detecção automática

## Troubleshooting

### Tema não aparece na vitrine
1. Verificar se `selected_theme_id` está setado
2. Verificar se tema está `is_active = true`
3. Verificar RLS policies
4. Checar console do navegador para erros

### Preview não funciona
1. Verificar se `theme_preview_id` foi salvo
2. Verificar permissões do usuário
3. Limpar cache do React Query

### Erro "Plano não permite"
1. Verificar plano do tenant em subscriptions
2. Confirmar que tema não é premium ou tenant tem plano adequado
3. Executar: `SELECT public.can_use_theme('tenant-id', 'theme-id');`

## Exemplos de Código

### Aplicar tema via API
```typescript
const applyTheme = async (themeId: string) => {
  const { data, error } = await supabase.functions.invoke("themes-apply", {
    body: { themeId, preview: false },
  });
  
  if (!data.success) {
    console.error(data.error);
    return;
  }
  
  console.log("Tema aplicado:", data.theme_id);
};
```

### Criar tema personalizado (futuro)
```typescript
const createTheme = async () => {
  const { data, error } = await supabase
    .from("themes")
    .insert({
      tenant_id: "uuid-tenant",
      name: "Meu Tema",
      colors: {
        "--primary": "#ff0000",
        "--bg": "#ffffff",
        "--text": "#000000",
      },
      is_premium: false,
    })
    .select()
    .single();
};
```

## Monitoring e Observability

### Logs de Auditoria
```sql
-- Ver últimas mudanças de tema
SELECT * FROM admin_logs
WHERE action IN ('theme.apply', 'theme.revert')
ORDER BY created_at DESC
LIMIT 20;
```

### Métricas Importantes
```sql
-- Quantos tenants por tema
SELECT t.name, COUNT(te.id) as tenant_count
FROM themes t
LEFT JOIN tenants te ON te.selected_theme_id = t.id
GROUP BY t.id, t.name
ORDER BY tenant_count DESC;

-- Temas mais revertidos (indicador de problema)
SELECT meta->>'theme_after' as theme_id, COUNT(*) as revert_count
FROM admin_logs
WHERE action = 'theme.revert'
GROUP BY meta->>'theme_after'
ORDER BY revert_count DESC;
```

## Conclusão

Sistema de temas implementado com:
- ✅ Preview seguro sem persistência
- ✅ Apply com transação atômica
- ✅ Revert com histórico
- ✅ Auditoria completa
- ✅ Gating por plano
- ✅ 3 temas free seeded
- ✅ Rollback automático em erro
- ✅ Sem breaking changes no layout
- ✅ Performance otimizada

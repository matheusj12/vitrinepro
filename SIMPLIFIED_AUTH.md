# Sistema de Autenticação Simplificado

## Objetivo
Fluxo de registro e login o mais simples possível, sem validações complexas ou bloqueios.

## Características

### Registro (Signup)
1. **Campos mínimos**: Nome, Email, Senha
2. **Sem validações complexas**:
   - Não valida força de senha
   - Não valida formato de nome
   - Não exige confirmação de email (se desabilitado no Supabase)
3. **Criação automática do tenant**:
   - Trigger cria tenant automaticamente após signup
   - Slug único garantido com fallback automático
   - Role padrão: admin (owner = 2)
   - Status: sempre ativo
4. **Mensagens de erro simples**:
   - "Email já cadastrado" (se email existe)
   - Mensagem genérica para outros erros

### Login
1. **Validação básica**: Email + Senha
2. **Sem bloqueios**:
   - Não verifica se usuário está ativo
   - Não verifica roles avançadas
   - Não valida domínio
3. **Mensagem de erro única**: "Email ou senha incorretos"

### Tenant (Loja)
Criado automaticamente via trigger `handle_new_user_tenant_setup()`:

**Geração de Slug Único**:
1. Primeira tentativa: nome limpo (ex: "loja-de-joao")
2. Se conflito: adiciona número aleatório (ex: "loja-de-joao-1234")
3. Se ainda conflita após 10 tentativas: usa timestamp (ex: "loja-1732408535")

**Dados Padrão**:
- `company_name`: "Loja de {nome}" ou "Minha Loja"
- `email`: Email do usuário
- `active`: TRUE sempre
- `subscription_status`: 'trial'
- `trial_ends_at`: +7 dias
- `primary_color`: '#F97316' (laranja)

**Seed Automático**:
- 3 categorias demo (Ofertas, Novidades, Populares)
- 3 produtos demo
- 1 banner de boas-vindas
- Store settings padrão
- **Nota**: Erros no seed não bloqueiam criação da conta

### Membership
- Criado automaticamente no trigger
- Role padrão: 2 (owner/admin)
- `tenant_id`: NUNCA null (constraint)

## Fluxo Técnico

### 1. Usuário clica "Criar Conta"
```
Frontend → Supabase Auth → auth.users
                         ↓
                    Trigger: on_auth_user_created
                         ↓
                    Function: handle_new_user_tenant_setup()
                         ↓
                    Cria: tenant + membership + seed
                         ↓
                    Retorna session para frontend
                         ↓
                    Redirect → /dashboard
```

### 2. Usuário clica "Entrar"
```
Frontend → Supabase Auth valida credenciais
                         ↓
                    Retorna session + user
                         ↓
                    Redirect → /dashboard
```

## Código Importante

### Trigger Simplificado
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user_tenant_setup()
RETURNS TRIGGER AS $$
BEGIN
  -- Loop para gerar slug único
  -- Cria tenant com dados mínimos
  -- Cria membership (role = 2)
  -- Tenta criar seed (não falha se erro)
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log erro mas não bloqueia criação
    RAISE WARNING 'Erro ao criar tenant: %', SQLERRM;
    RETURN NEW;
END;
$$;
```

### Frontend - Registro
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: { full_name: name }
  }
});

// Mensagem simples
if (error?.message.includes("already registered")) {
  throw new Error("Email já cadastrado");
}

toast.success("Conta criada com sucesso!");
navigate("/dashboard");
```

### Frontend - Login
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});

if (error) {
  throw new Error("Email ou senha incorretos");
}

toast.success("Bem-vindo de volta!");
navigate("/dashboard");
```

## Configuração do Supabase

**CRÍTICO**: Desabilitar confirmação de email:

1. Acesse: https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/auth/providers
2. Vá em **Email** provider
3. Desabilite "Confirm email"
4. Salve

Sem isso, usuário não consegue login automático após registro.

## Sem Bloqueios

Removido temporariamente:
- ❌ Validação de usuário desativado
- ❌ Validação de roles avançadas
- ❌ Validação de domínio
- ❌ Validação de slug customizado
- ❌ Validação de telefone
- ❌ Validação de dados da loja

## Mensagens para Usuário

### Sucesso
- **Registro**: "Conta criada com sucesso!"
- **Login**: "Bem-vindo de volta!"

### Erro
- **Email já existe**: "Email já cadastrado"
- **Login falhou**: "Email ou senha incorretos"
- **Erro genérico**: Mensagem do Supabase (raro)

### Loading
- **Tenant não carregado**: "Configurando sua loja... Aguarde"
- Botão: "Recarregar" (reload page)

## Troubleshooting

### Usuário criado mas sem tenant
1. Ver logs do Postgres: https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/logs/postgres-logs
2. Verificar se trigger disparou
3. Recriar tenant manualmente se necessário

### Slug duplicado (improvável)
- Trigger tenta até 10x com números aleatórios
- Fallback: usa timestamp como slug

### Email já cadastrado
- Mensagem clara: "Email já cadastrado"
- Usuário deve fazer login

## Segurança

Apesar da simplicidade:
- ✅ Senhas criptografadas (Supabase bcrypt)
- ✅ Tokens JWT assinados
- ✅ RLS protege dados por tenant
- ✅ Sessions gerenciadas pelo Supabase
- ✅ HTTPS obrigatório

## Próximas Melhorias (Futuro)

Após validar MVP:
- Adicionar confirmação de email (opcional)
- Adicionar validação de força de senha
- Adicionar 2FA (opcional)
- Adicionar recuperação de senha
- Adicionar validações de dados da loja
- Adicionar bloqueio de usuários desativados

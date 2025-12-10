# Configuração do Supabase para Login Sem Confirmação de Email

## IMPORTANTE: Desabilitar Confirmação de Email

Para permitir que usuários façam login imediatamente após o registro, **sem precisar confirmar o email**, siga estes passos:

### 1. Acessar Painel do Supabase

Abra: https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/auth/providers

### 2. Desabilitar Confirmação de Email

1. No menu lateral, vá em **Authentication** → **Providers**
2. Role até a seção **Email**
3. Desabilite a opção **"Confirm email"**
4. Clique em **Save**

**OU**

1. No menu lateral, vá em **Authentication** → **URL Configuration**
2. Em **Email Auth**, desabilite **"Enable email confirmations"**

### 3. Testar

Após desabilitar:
- Crie uma nova conta em `/auth`
- Usuário será automaticamente logado e redirecionado para `/dashboard`
- Tenant e produtos demo serão criados automaticamente pelo trigger `handle_new_user_tenant_setup`

## Como Funciona o Sistema

### Fluxo de Registro

1. **Usuário preenche**: Nome, Email, Senha
2. **Supabase Auth**: Cria usuário em `auth.users`
3. **Trigger automático** (`on_auth_user_created`): Executa `handle_new_user_tenant_setup()`
4. **Sistema cria**:
   - 1 tenant (loja) com slug único
   - 1 membership (role owner = 2)
   - 3 categorias demo
   - 4 produtos demo
   - 1 banner demo
   - Store settings padrão

### Fluxo de Login

1. **Usuário preenche**: Email, Senha
2. **Supabase valida** credenciais
3. **Retorna**: Session token + user data
4. **Frontend salva** token no localStorage (automático via Supabase client)
5. **Redirect** para `/dashboard`

### Logout

1. Usuário clica "Sair" no dashboard
2. `supabase.auth.signOut()` limpa sessão
3. Redirect para `/auth`

## Segurança

- Senhas são automaticamente criptografadas pelo Supabase (bcrypt)
- Tokens JWT são gerados e validados pelo Supabase
- RLS (Row Level Security) protege dados por tenant
- Sessions expiram automaticamente após 1 hora (configurável)

## Logs de Auth

Logs de autenticação estão disponíveis em:
https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/logs/auth-logs

## Endpoints Supabase Auth (via SDK)

### Registro
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'senha123',
  options: {
    data: { full_name: 'Nome do Usuário' }
  }
});
```

### Login
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'senha123'
});
```

### Logout
```typescript
await supabase.auth.signOut();
```

### Obter Sessão Atual
```typescript
const { data: { session } } = await supabase.auth.getSession();
```

### Obter Usuário Atual
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

## Troubleshooting

### "Email already registered"
- Email já cadastrado
- Usuário deve fazer login ao invés de criar nova conta

### "Invalid login credentials"
- Email ou senha incorretos
- Verificar se email existe
- Verificar se confirmação de email está desabilitada

### Usuário não tem tenant
- Verificar se trigger está funcionando
- Ver logs do Postgres: https://supabase.com/dashboard/project/rtljfxgxpgzabbsmqwno/logs/postgres-logs
- Executar manualmente:
```sql
SELECT * FROM tenants WHERE user_id = 'uuid-do-usuario';
SELECT * FROM tenant_memberships WHERE user_id = 'uuid-do-usuario';
```

### Session não persiste
- Verificar se localStorage está habilitado no navegador
- Supabase client já está configurado com `storage: localStorage`

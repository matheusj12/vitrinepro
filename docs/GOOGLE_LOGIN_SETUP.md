# 🔐 Configuração do Login com Google - VitrinePro

## Passo 1: Criar projeto no Google Cloud Console

1. Acesse: **https://console.cloud.google.com**
2. Crie um novo projeto ou selecione um existente
3. Vá em **APIs & Services** → **Credentials**

## Passo 2: Configurar tela de consentimento OAuth

1. Clique em **OAuth consent screen**
2. Escolha **External** (para qualquer usuário Gmail)
3. Preencha:
   - **App name**: VitrinePro
   - **User support email**: seu email
   - **Developer contact**: seu email
4. Clique em **Save and Continue**
5. Em **Scopes**, adicione:
   - `email`
   - `profile`
   - `openid`
6. Continue até o final

## Passo 3: Criar credenciais OAuth

1. Vá em **Credentials** → **Create Credentials** → **OAuth client ID**
2. Escolha **Web application**
3. Nome: `VitrinePro Web`
4. Em **Authorized JavaScript origins**, adicione:
   ```
   https://prjhknveicdfykkglxta.supabase.co
   http://localhost:5173
   http://localhost:3000
   ```
5. Em **Authorized redirect URIs**, adicione:
   ```
   https://prjhknveicdfykkglxta.supabase.co/auth/v1/callback
   ```
6. Clique em **Create**
7. **Copie o Client ID e Client Secret**

## Passo 4: Configurar no Supabase

1. Acesse: **https://supabase.com/dashboard/project/prjhknveicdfykkglxta/auth/providers**
2. Encontre **Google** na lista
3. Clique para expandir
4. Ative o toggle **Enable Sign in with Google**
5. Cole:
   - **Client ID**: (do passo anterior)
   - **Client Secret**: (do passo anterior)
6. Clique em **Save**

## Passo 5: Desabilitar confirmação de email

1. Ainda em **https://supabase.com/dashboard/project/prjhknveicdfykkglxta/auth/providers**
2. Clique em **Email**
3. Desabilite **"Confirm email"**
4. Clique em **Save**

## ✅ Pronto!

Agora os usuários podem:
- Fazer login com Google (sem confirmação)
- Cadastrar com email/senha (sem confirmação)

## 🧪 Testar

1. Acesse a página de login
2. Clique em "Continuar com Google"
3. Faça login com sua conta Google
4. Você será redirecionado para o dashboard!

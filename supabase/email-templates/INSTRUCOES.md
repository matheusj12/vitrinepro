# 📧 Configuração de Templates de Email - VitrinePro

## Como configurar os emails bonitos no Supabase

### Passo 1: Acessar o Dashboard
Abra: **https://supabase.com/dashboard/project/prjhknveicdfykkglxta/auth/templates**

### Passo 2: Configurar cada template

---

## 📬 Template: Confirm signup (Confirmação de cadastro)

**Subject:** Confirme seu cadastro no VitrinePro 🎉

**Body (HTML):**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;background-color:#f0f4f8">
  <table role="presentation" style="width:100%;border-collapse:collapse">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <tr>
            <td style="padding:40px 40px 30px;text-align:center;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:16px 16px 0 0">
              <div style="font-size:48px;margin-bottom:16px">🎉</div>
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700">VitrinePro</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,.9);font-size:14px">Sua vitrine digital profissional</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px">
              <h2 style="margin:0 0 16px;color:#1e293b;font-size:24px;font-weight:600;text-align:center">Confirme seu cadastro! ✨</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:16px;line-height:1.6;text-align:center">Estamos muito felizes em ter você conosco! Falta apenas um passo para você começar a criar sua loja virtual.</p>
              <table role="presentation" style="width:100%">
                <tr>
                  <td align="center" style="padding:16px 0 32px">
                    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#fff;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;box-shadow:0 4px 14px rgba(99,102,241,.4)">Confirmar meu email →</a>
                  </td>
                </tr>
              </table>
              <h3 style="margin:24px 0 16px;color:#1e293b;font-size:18px;font-weight:600">🚀 O que você pode fazer após confirmar:</h3>
              <p style="margin:8px 0;color:#64748b;font-size:14px">📦 Cadastrar seus produtos com fotos e preços</p>
              <p style="margin:8px 0;color:#64748b;font-size:14px">🎨 Personalizar sua loja com cores e logo</p>
              <p style="margin:8px 0;color:#64748b;font-size:14px">📱 Compartilhar o link pelo WhatsApp</p>
              <div style="margin-top:24px;padding:16px;background-color:#f8fafc;border-radius:12px">
                <p style="margin:0 0 8px;color:#64748b;font-size:12px">Se o botão não funcionar, copie e cole este link:</p>
                <p style="margin:0;color:#6366f1;font-size:11px;word-break:break-all">{{ .ConfirmationURL }}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-radius:0 0 16px 16px;text-align:center">
              <p style="margin:0;color:#94a3b8;font-size:12px">© 2026 VitrinePro. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🔐 Template: Reset password (Recuperar senha)

**Subject:** Recuperar senha - VitrinePro 🔐

**Body (HTML):**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;background-color:#f0f4f8">
  <table role="presentation" style="width:100%;border-collapse:collapse">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <tr>
            <td style="padding:40px 40px 30px;text-align:center;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:16px 16px 0 0">
              <div style="font-size:48px;margin-bottom:16px">🔐</div>
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700">VitrinePro</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px">
              <h2 style="margin:0 0 16px;color:#1e293b;font-size:24px;font-weight:600;text-align:center">Recuperar sua senha</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:16px;line-height:1.6;text-align:center">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha.</p>
              <table role="presentation" style="width:100%">
                <tr>
                  <td align="center" style="padding:16px 0 32px">
                    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#fff;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;box-shadow:0 4px 14px rgba(99,102,241,.4)">Redefinir minha senha →</a>
                  </td>
                </tr>
              </table>
              <div style="padding:16px;background-color:#fef3c7;border-radius:12px;border-left:4px solid #f59e0b">
                <p style="margin:0;color:#92400e;font-size:14px">⚠️ <strong>Importante:</strong> Este link expira em 1 hora. Se você não solicitou esta alteração, ignore este email.</p>
              </div>
              <div style="margin-top:24px;padding:16px;background-color:#f8fafc;border-radius:12px">
                <p style="margin:0 0 8px;color:#64748b;font-size:12px">Link alternativo:</p>
                <p style="margin:0;color:#6366f1;font-size:11px;word-break:break-all">{{ .ConfirmationURL }}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-radius:0 0 16px 16px;text-align:center">
              <p style="margin:0;color:#94a3b8;font-size:12px">© 2026 VitrinePro. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🔗 Template: Magic Link

**Subject:** Seu link de acesso - VitrinePro ✨

**Body (HTML):**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;background-color:#f0f4f8">
  <table role="presentation" style="width:100%;border-collapse:collapse">
    <tr>
      <td align="center" style="padding:40px 20px">
        <table role="presentation" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <tr>
            <td style="padding:40px 40px 30px;text-align:center;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:16px 16px 0 0">
              <div style="font-size:48px;margin-bottom:16px">✨</div>
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700">VitrinePro</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px">
              <h2 style="margin:0 0 16px;color:#1e293b;font-size:24px;font-weight:600;text-align:center">Seu link de acesso</h2>
              <p style="margin:0 0 24px;color:#64748b;font-size:16px;line-height:1.6;text-align:center">Clique no botão abaixo para acessar sua conta automaticamente, sem precisar de senha.</p>
              <table role="presentation" style="width:100%">
                <tr>
                  <td align="center" style="padding:16px 0 32px">
                    <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);color:#fff;text-decoration:none;font-size:16px;font-weight:600;border-radius:12px;box-shadow:0 4px 14px rgba(99,102,241,.4)">Acessar minha conta →</a>
                  </td>
                </tr>
              </table>
              <div style="margin-top:24px;padding:16px;background-color:#f8fafc;border-radius:12px">
                <p style="margin:0 0 8px;color:#64748b;font-size:12px">Link alternativo:</p>
                <p style="margin:0;color:#6366f1;font-size:11px;word-break:break-all">{{ .ConfirmationURL }}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px;background-color:#f8fafc;border-radius:0 0 16px 16px;text-align:center">
              <p style="margin:0;color:#94a3b8;font-size:12px">© 2026 VitrinePro. Todos os direitos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📝 Salvar as alterações

Após colar cada template, clique em **"Save"** para salvar.

## 🧪 Testar

1. Faça logout da aplicação
2. Crie uma nova conta com um email de teste
3. Verifique se o email chegou com o novo design!

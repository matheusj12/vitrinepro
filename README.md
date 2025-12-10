# VitrinePro

**Sua Vitrine Digital Profissional** - Plataforma SaaS para criação de catálogos virtuais com integração WhatsApp.

## 🚀 Tecnologias

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, Shadcn/ui
- **Animações**: Framer Motion
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Auth**: Supabase Auth

## ✨ Funcionalidades

- 📱 Catálogo digital responsivo
- 💬 Orçamentos via WhatsApp
- 🎨 Temas personalizáveis
- 📊 Analytics em tempo real
- 🔔 Notificações
- 🖼️ Banners e categorias
- 🔐 Multi-tenant com Row Level Security
- 📱 QR Code para compartilhamento
- 🌙 Dark Mode

## 🛠️ Instalação

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 📁 Estrutura

```
vitrinepro/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas da aplicação
│   ├── hooks/          # Custom hooks
│   ├── integrations/   # Supabase client
│   └── lib/            # Utilitários
├── supabase/
│   ├── functions/      # Edge Functions
│   └── migrations/     # Migrações SQL
└── public/             # Assets estáticos
```

## 🔑 Variáveis de Ambiente

```env
VITE_SUPABASE_PROJECT_ID="seu-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-anon-key"
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
```

## 📄 Licença

MIT © 2025 VitrinePro

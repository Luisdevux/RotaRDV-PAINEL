# 🚛 RotaRDV - Painel Web de Gestão de Frotas e Despesas

<div align="center">
  <img src="https://rota-rdv.web.fslab.dev/7c4bb021-7946-44b4-acc2-cdb9c29aadc2.jpeg" width="120" height="120" style="border-radius: 20px;" alt="RotaRDV Logo" />
  <h3>Sistema de Controle Operacional, Auditoria de Despesas e Gestão de Condutores para Transportadoras</h3>
</div>

---

## 📌 Visão Geral

O **RotaRDV Painel Web** é a central administrativa e analítica do ecossistema RotaRDV. Desenvolvido em **Next.js 15 (App Router)** e **TypeScript**, oferece aos gestores de frotas e administradores uma experiência moderna e completa para:

* **Dashboard em Tempo Real:** Indicadores-chave de desempenho (KPIs), distância total percorrida (KM), despesas consolidadas e gráficos interativos com Recharts.
* **Auditoria de Despesas & Notas Fiscais:** Visualização de comprovantes fiscais com zoom em alta resolução, rotação, download e detalhamento de abastecimentos.
* **Gestão de Motoristas:** Cadastro ágil com disparo de e-mails de boas-vindas pelo Hermes, vínculo com caminhões da frota e controle de status.
* **Gestão da Frota:** Controle de cavalos mecânicos, carretas/implementos, tipos de combustíveis preferenciais e capacidade de tanques.
* **Auditoria de Viagens:** Rastreamento de odômetros inicial/final, motoristas condutores e resumo financeiro automático.
* **Configurações da Transportadora:** Edição cadastral, personalização e upload do logotipo corporativo.

---

## 🛠️ Tecnologias e Arquitetura

* **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Components & Client Components)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/) com tipagem estrita dividida por domínio (`src/types/`)
* **Design System & UI:** [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Shadcn UI](https://ui.shadcn.com/) e [Lucide Icons](https://lucide.dev/)
* **Gerenciamento de Estado de Servidor:** [TanStack Query v5 (React Query)](https://tanstack.com/query/latest)
* **Autenticação:** [NextAuth.js](https://next-auth.js.org/) com JWT Credentials, Google OAuth e auto-refresh de access tokens
* **Formulários & Validações:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
* **Gráficos & Métricas:** [Recharts](https://recharts.org/)
* **Notificações:** [Sonner Toast](https://sonner.emilkowal.ski/)
* **HTTP Client:** [Axios](https://axios-http.com/) com interceptores de sessão e headers Bearer automáticos
* **Deploy & Containerização:** Docker Multi-stage (Standalone output), Kubernetes / K3s, CI/CD Kaniko via GitLab Runner

---

## 📁 Estrutura do Projeto

```
tcc-despesas-painel/
├── deploy/                        # Manifestos Kubernetes (Deployment, Service, Ingress, Secrets)
│   ├── rotardv-painel.yaml
│   ├── rotardv-painel-ingress.yaml
│   └── DEPLOY.md
├── public/                        # Arquivos estáticos
├── src/
│   ├── app/                       # Rotas Next.js App Router
│   │   ├── (auth)/                # Rotas protegidas (Dashboard, Motoristas, Veículos, Viagens, Despesas)
│   │   │   ├── dashboard/
│   │   │   ├── motoristas/
│   │   │   ├── veiculos/
│   │   │   ├── viagens/
│   │   │   ├── despesas/
│   │   │   ├── empresa/configuracoes/
│   │   │   ├── empresas/          # Painel Master Admin
│   │   │   └── perfil/
│   │   ├── (no-auth)/             # Rotas públicas (Login, Cadastro/Onboarding, Esqueci Senha)
│   │   │   ├── login/
│   │   │   ├── cadastro/
│   │   │   ├── esqueci-senha/
│   │   │   └── redefinir-senha/
│   │   ├── api/auth/[...nextauth]/# NextAuth Route Handler com JWT Refresh
│   │   ├── globals.css            # Design tokens HSL e Tailwind
│   │   ├── layout.tsx             # Root layout com Providers
│   │   ├── page.tsx               # Redirecionamento raiz
│   │   └── not-found.tsx          # Página 404
│   ├── components/                # Componentes reutilizáveis
│   │   ├── ui/                    # Primitivas Shadcn/Radix (Button, Dialog, Input, Table, Card...)
│   │   ├── Sidebar.tsx            # Menu lateral colapsável com logotipo oficial
│   │   ├── Header.tsx             # Topbar com seletor de tema e menu de perfil
│   │   ├── DashboardWrapper.tsx   # Shell layout estrutural
│   │   ├── MetricCard.tsx         # Cards de KPI analíticos
│   │   └── ComprovanteModal.tsx   # Visualizador de notas fiscais com zoom e rotação
│   ├── hooks/                     # Custom React Query Hooks (useAuth, useDashboard, useViagens...)
│   ├── lib/                       # Utilitários e formatadores (formatCurrency, formatKM, formatCNPJ...)
│   ├── providers/                 # Providers (Session, Theme, ReactQuery, ActiveEmpresa)
│   ├── proxy.ts                   # Next.js Middleware de controle de acesso
│   ├── services/                  # Camada de integração com a API Backend
│   └── types/                     # Tipos TypeScript modulares (empresa, usuario, veiculo, viagem...)
├── .env.example
├── .gitlab-ci.yml                 # Pipeline Kaniko + Kubectl para VM
├── Dockerfile                     # Multi-stage Standalone
├── docker-compose.yml
├── package.json
└── tailwind.config.ts
```

---

## 🚀 Como Executar Localmente

### 1. Clonar e Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie `.env.example` para `.env`:
```bash
cp .env.example .env
```

### 3. Rodar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000`.

---

## 🐳 Executando com Docker

```bash
docker-compose up --build
```

---

## 📜 Licença
Projeto desenvolvido no âmbito de Trabalho de Conclusão de Curso (TCC). Todos os direitos reservados.

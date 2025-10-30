# 🧩 Jungle Gaming — Full-Stack Challenge (Monorepo)

Este repositório contém a implementação incremental do **Desafio Full-Stack da Jungle Gaming**.  
O objetivo é entregar um **sistema colaborativo de gestão de tarefas** composto por múltiplos serviços NestJS, um API Gateway, uma aplicação React e comunicação assíncrona via RabbitMQ.

> **Status atual (Fim do Dia 4):**
>
> - ✅ Infraestrutura Docker e Turborepo operacionais
> - ✅ Auth Service completo (cadastro, login, refresh token, bcrypt, TypeORM/Postgres)
> - ✅ API Gateway com proteção JWT, rate limiting, Swagger e rotas proxy para auth e tasks
> - ✅ Tasks Service com CRUD completo de tarefas + paginação, validações rigorosas e migrations
> - ⏳ Notificações, comentários, histórico e frontend em desenvolvimento (Dias 5+)

---

## 🏗️ Arquitetura

```
                       ┌──────────────┐
                       │   Web (WIP)  │
                       └──────┬───────┘
                              │ HTTP (JWT)
                      ┌───────▼────────┐
                      │  API Gateway   │  Swagger → http://localhost:3001/api/docs
                      └───────▲────────┘
                          HTTP│
┌──────────────────────────────┼─────────────────────────────┐
│        Serviços internos NestJS + Postgres + RabbitMQ      │
│  ┌─────────────┐    ┌────────────────┐       ┌───────────┐ │
│  │ Auth Service│    │ Tasks Service  │       │ Notifications│ (backlog)
│  └──────┬──────┘    └───────┬────────┘       └───────┬───┘ │
│         │ JWT & Users       │ CRUD + Assignees         │    │
│         │                   │                          │    │
│      ┌──▼──┐            ┌───▼───┐                 ┌────▼──┐ │
│      │ DB  │◄───────────┤ Tables│                 │RabbitMQ│ │
│      └─────┘            └───────┘                 └───────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Stack Técnica

- **Monorepo & DevX:** Turborepo, npm workspaces, TypeScript 5, ESLint, Prettier
- **Backend:** NestJS 11, TypeORM 0.3, PostgreSQL 17, Docker Compose
- **Infra complementar:** RabbitMQ 3 (management UI), Swagger/OpenAPI via Nest
- **Frontend:** React + TanStack Router + Tailwind + shadcn/ui (a partir do Dia 7)

---

## 🚀 Como Rodar o Projeto

### 1️⃣ Pré-requisitos

- Docker + Docker Compose
- Node.js 20+ (para scripts locais e migrations)

---

### 2️⃣ Instalação

```bash
npm install
```

---

### 3️⃣ Variáveis de ambiente

Cada app possui um `.env.example`.  
Copie-o para `.env`:

```bash
cp apps/<app>/.env.example apps/<app>/.env
```

Valores padrão (local/dev) já funcionam com o `docker-compose.yml` presente na raiz.

---

### 4️⃣ Subir toda a stack

```bash
docker compose up --build
```

**Serviços expostos:**

| Serviço              | Porta | URL                                  |
| -------------------- | ----- | ------------------------------------ |
| Web (WIP)            | 3000  | http://localhost:3000                |
| API Gateway          | 3001  | http://localhost:3001                |
| Swagger (Gateway)    | —     | http://localhost:3001/api/docs       |
| Auth Service         | 3002  | http://localhost:3002                |
| Tasks Service        | 3003  | http://localhost:3003                |
| Notifications (stub) | 3004  | http://localhost:3004                |
| RabbitMQ UI          | 15672 | http://localhost:15672 (admin/admin) |

---

### 5️⃣ Rodar migrations

Após a stack estar de pé, execute:

```bash
# Auth
docker compose exec auth-service npm run migration:run --workspace=@jungle/auth-service

# Tasks
docker compose exec tasks-service npm run migration:run --workspace=@jungle/tasks-service
```

---

### 6️⃣ Checagens locais (opcional)

```bash
npm run typecheck --workspace=@jungle/tasks-service
npm run build --workspace=@jungle/tasks-service
```

---

## 🔐 Fluxo Implementado até o Momento

### Autenticação

| Endpoint                  | Via Gateway | Descrição                     |
| ------------------------- | ----------- | ----------------------------- |
| `POST /api/auth/register` | ✅          | Cria usuário + retorna tokens |
| `POST /api/auth/login`    | ✅          | Autentica e retorna tokens    |
| `POST /api/auth/refresh`  | ✅          | Atualiza access token         |

- Hash de senha com bcrypt (`BCRYPT_SALT_ROUNDS`, default 10)
- JWT Access (15 min) e Refresh (7 dias)
- Refresh token armazenado como hash no banco (`users.refresh_token_hash`)

**Testar via Swagger:**

1. Acesse http://localhost:3001/api/docs
2. Registre um usuário
3. Faça login e obtenha os tokens
4. Clique em **Authorize** e insira `Bearer <accessToken>`
5. Teste as rotas de Tasks autenticadas

---

### Tasks Service (Dia 4)

| Endpoint                 | Protegido | Observações                                             |
| ------------------------ | --------- | ------------------------------------------------------- |
| `GET /api/tasks`         | ✅        | Paginação (`page`, `size`), ordenação desc por criação  |
| `POST /api/tasks`        | ✅        | Valida título, status, prioridade, `assigneeIds` únicos |
| `GET /api/tasks/{id}`    | ✅        | Usa `ParseUUIDPipe` (400 p/ UUID inválido)              |
| `PUT /api/tasks/{id}`    | ✅        | Transação: atualiza task + atribuições de forma atômica |
| `DELETE /api/tasks/{id}` | ✅        | Remove tarefa e cascade nas atribuições                 |

Regras principais:

- `assigneeIds` deduplicados (duplicatas → 400).
- Transações garantem consistência entre `tasks` e `task_assignees`.
- `dueDate` validado e convertido para `Date`.
- Respostas padronizadas com metadados (`page`, `size`, `total`).

---

### RabbitMQ & Notifications

- RabbitMQ operacional e acessível via UI (`admin/admin`)
- Publicação de eventos (`task.created`, `task.updated`, `task.comment.created`) e WebSocket de notificações serão adicionados no Dia 5+

---

## ⚖️ Decisões & Trade-offs

- **Monorepo via Turborepo:** facilita o compartilhamento de tipos/utilitários e builds encadeados
- **TypeORM + migrations:** garante versionamento e evita `synchronize` em produção
- **Validações agressivas:** erros 400 antecipam falhas de negócio e evitam 500 genéricos
- **Swagger:** substitui Postman e documenta automaticamente os endpoints

---

## 📊 Evolução do Banco de Dados (Dias 4 → 5)

> Evidências capturadas via DBeaver (modo escuro) mostrando a evolução do schema PostgreSQL `challenge_db`.

![Figura 1 – Estrutura geral do banco (Dia 4)](./docs/images/db-figure-1.png)
![Figura 2 – Estrutura detalhada da tabela tasks](./docs/images/db-figure-2-tasks.png)
![Figura 3 – Estrutura detalhada da tabela users](./docs/images/db-figure-3-users.png)
![Figura 4 – ER Diagram – Dia 4](./docs/images/db-figure-4-er-dia4.png)

---

## 🧱 Evolução esperada — Fim do Dia 5

Após as migrations do **Dia 5 (Tasks Events)**, o banco passa a incluir:

| Nova Tabela    | Descrição                                                          | Relações                                   |
| -------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| `comments`     | Armazena comentários de usuários em tarefas.                       | `task_id → tasks.id`, `user_id → users.id` |
| `task_history` | Registra eventos de auditoria (criação, atualização, comentários). | `task_id → tasks.id`                       |

_Futuras imagens (após Dia 5):_

![Figura 5 – Estrutura geral do banco (Dia 5)](./docs/images/db-figure-5-dia5.png)
![Figura 6 – Estrutura da tabela comments](./docs/images/db-figure-6-comments.png)
![Figura 7 – Estrutura da tabela task_history](./docs/images/db-figure-7-history.png)
![Figura 8 – ER Diagram – Dia 5](./docs/images/db-figure-8-er-dia5.png)

---

📌 **Autor:** [Bruno Macedo](https://github.com/brunomacedo89)  
📆 **Progresso:** Implementação incremental (Dias 1–10)  
🧠 **Propósito:** Reproduzir um ambiente profissional de desenvolvimento full-stack com foco em arquitetura limpa, versionamento e documentação técnica.

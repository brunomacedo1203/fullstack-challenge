# Jungle Gaming — Full-Stack Challenge – Monorepo (WIP)

Este repositório contém a implementação incremental do desafio full-stack da Jungle Gaming. O objetivo final é entregar um sistema colaborativo de gestão de tarefas composto por múltiplos serviços NestJS, um API Gateway, aplicação React e comunicação assíncrona via RabbitMQ.

> **Status atual (Fim do Dia 4):**
>
> - Infraestrutura Docker e Turborepo operacionais.
> - Auth Service completo (cadastro, login, refresh token, bcrypt, TypeORM/Postgres).
> - API Gateway com proteção JWT, rate limiting, Swagger e rotas proxy para auth e tasks.
> - Tasks Service com CRUD de tarefas + paginação, validações rigorosas e migrations.
> - Notificações, comentários, histórico e frontend ainda em desenvolvimento (Dias 5+).

## Arquitetura

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

## Stack

- **Monorepo & DevX**: Turborepo, npm workspaces, TypeScript 5, ESLint, Prettier.
- **Backend**: NestJS 11, TypeORM 0.3, PostgreSQL 17, Docker Compose.
- **Infra complementar**: RabbitMQ 3 (management UI), Swagger/OpenAPI via Nest.
- **Frontend**: React + TanStack Router + Tailwind + shadcn/ui (implementação a partir do Dia 7).

## Como rodar

### 1. Pré-requisitos

- Docker + Docker Compose
- Node.js 20 (para rodar scripts locais, migrations etc.)

### 2. Instalação

```bash
npm install
```

### 3. Variáveis de ambiente

Cada app possui um `.env.example`. Copie para `.env`:

```bash
cp apps/<app>/.env.example apps/<app>/.env
```

Valores padrão (local/dev) já funcionam com o `docker-compose.yml` presente.

### 4. Subir toda a stack

```bash
docker compose up --build
```

Serviços expostos:

| Serviço              | Porta | URL                                  |
| -------------------- | ----- | ------------------------------------ |
| Web (WIP)            | 3000  | http://localhost:3000                |
| API Gateway          | 3001  | http://localhost:3001                |
| Swagger (Gateway)    | —     | http://localhost:3001/api/docs       |
| Auth Service         | 3002  | http://localhost:3002                |
| Tasks Service        | 3003  | http://localhost:3003                |
| Notifications (stub) | 3004  | http://localhost:3004                |
| RabbitMQ UI          | 15672 | http://localhost:15672 (admin/admin) |

### 5. Rodar migrations

Execute assim que a stack estiver de pé:

```bash
# Auth
docker compose exec auth-service npm run migration:run --workspace=@jungle/auth-service

# Tasks
docker compose exec tasks-service npm run migration:run --workspace=@jungle/tasks-service
```

### 6. Checagens locais (opcional)

```bash
npm run typecheck --workspace=@jungle/tasks-service
npm run build --workspace=@jungle/tasks-service
```

## Fluxo implementado até o momento

### Autenticação

| Endpoint                  | Via Gateway | Descrição                     |
| ------------------------- | ----------- | ----------------------------- |
| `POST /api/auth/register` | ✅          | Cria usuário + retorna tokens |
| `POST /api/auth/login`    | ✅          | Autentica e retorna tokens    |
| `POST /api/auth/refresh`  | ✅          | Atualiza access token         |

- Hash de senha com bcrypt (`BCRYPT_SALT_ROUNDS`, default 10).
- JWT Access (15 min) e Refresh (7 dias) – chaves compartilhadas entre Auth e Gateway.
- Refresh token armazenado como hash no banco (`users.refresh_token_hash`).

**Como testar** (via Swagger):

1. Abrir http://localhost:3001/api/docs.
2. Executar `POST /api/auth/register` para criar usuário.
3. Usar `POST /api/auth/login` para obter `accessToken` e `refreshToken`.
4. No Swagger, clicar em **Authorize** e informar `Bearer <accessToken>`.
5. Testar chamadas protegidas (Tasks) usando o token carregado.

### Tasks Service (Dia 4)

| Endpoint                 | Protegido | Observações                                             |
| ------------------------ | --------- | ------------------------------------------------------- |
| `GET /api/tasks`         | ✅        | Paginação (`page`, `size`), ordenação desc por criação  |
| `POST /api/tasks`        | ✅        | Valida título, status, prioridade, `assigneeIds` únicos |
| `GET /api/tasks/{id}`    | ✅        | Utiliza `ParseUUIDPipe` (400 p/ UUID inválido)          |
| `PUT /api/tasks/{id}`    | ✅        | Transação: atualiza task + atribuições de forma atômica |
| `DELETE /api/tasks/{id}` | ✅        | Remove tarefa e cascade nas atribuições                 |

Regras principais:

- `assigneeIds` deduplicados; duplicatas resultam em 400 (não 500).
- Atualização de atribuídos ocorre dentro de transação: não há janela em que a tarefa fica sem responsáveis se o insert falhar.
- `dueDate` é validado e convertido para `Date`; valores inválidos geram 400.
- Respostas padronizadas com `assigneeIds` (lista de UUIDs) e metadados (`page`, `size`, `total`).

**Como testar rapidamente (CLI):**

```bash
# Registrar usuário
curl -sS -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","username":"demo","password":"password"}'

# Efetuar login e capturar token
TOKEN=$(curl -sS -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"password"}' | jq -r '.accessToken')

# Criar tarefa
curl -sS -X POST http://localhost:3001/api/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Primeira tarefa","description":"via CLI"}'

# Listar
curl -sS http://localhost:3001/api/tasks -H "Authorization: Bearer $TOKEN"
```

> Caso o `jq` não esteja instalado, substitua a extração do token por script em Node ou copie manualmente do login.

### RabbitMQ & Notifications

- RabbitMQ já está operacional e acessível via UI (admin/admin).
- Publicação de eventos (`task.created`, `task.updated`, `task.comment.created`) e o Notifications Service serão implementados nos próximos dias (Dia 5+).

## Decisões & Trade-offs

- **Monorepo via Turborepo**: facilita o compartilhamento de tipos/utilitários e builds encadeados.
- **TypeORM + migrations**: evita `synchronize` em produção e garante versionamento do schema.
- **Validações agressivas**: preferimos falhar cedo com 400 a receber erros 500 genéricos do banco.
- **Swagger como ferramenta de teste**: substitui Postman nesse projeto, diminui setup externo e documenta os endpoints automaticamente.

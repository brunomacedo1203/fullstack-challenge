# ✅ Jungle Gaming — Full-Stack Challenge Implementation Checklist

> **Objetivo:** Entregar o Sistema de Gestão de Tarefas Colaborativo (monorepo com React + Nest + RabbitMQ) em **10 dias**, seguindo fielmente o README do desafio.

---

## 🗓️ Dia 1 — Setup e Infraestrutura

**Meta:** Estruturar o monorepo e validar o ambiente base (Docker + Turborepo + comunicação).

### 🔹 Fases & Subtasks

1. **Fase 1 — Monorepo e pacotes base** _(concluída)_
   - [x] Criar estrutura `apps/` e `packages/` conforme enunciado.
   - [x] Adicionar `packages/tsconfig`, `packages/eslint-config`, `packages/types`.
   - **Commit:** `chore: bootstrap monorepo structure`

2. **Fase 2 — Docker e variáveis** _(concluída)_
   - [x] Copiar `docker-compose.yml` e criar Dockerfile para cada app.
   - [x] Criar `.env.example` mínimo em cada app.
   - **Commit:** `chore: add docker setup and env samples`

   _Checkpoint:_ Estrutura do monorepo definida com Dockerfiles e `.env` prontos.

3. **Fase 3 — Validação da stack** _(concluída)_
   - [x] Rodar `docker compose up --build` e garantir containers de pé.
   - [x] Validar RabbitMQ UI e conexão Postgres (psql/DBeaver).
   - **Commit:** `chore: validate local stack startup`

**Checkpoint:** Docker e containers rodando sem erros.

---

## 🗓️ Dia 2 — Auth Service (NestJS + TypeORM + JWT)

**Meta:** Implementar login, cadastro e refresh tokens no serviço de autenticação.

### 🔹 Fases & Subtasks

1. **Fase 1 — Domínio de usuários** _(concluída)_
   - [x] Criar módulos `users` e `auth` no auth-service.
   - [x] Implementar entity `User` + migration `users`.
   - **Commit:** `feat(auth-service): add user domain and migration`

2. **Fase 2 — Fluxos de cadastro/login** _(concluída)_
   - [x] Hash de senha com bcrypt.
   - [x] Endpoints `POST /auth/register` e `POST /auth/login`.
   - **Commit:** `feat(auth-service): implement register and login`

   _Checkpoint:_ Registro e login respondendo com tokens no auth-service.

3. **Fase 3 — Refresh tokens e JWT** _(concluída)_
   - [x] Implementar JWT access/refresh + refresh token hash na tabela.
   - [x] Endpoint `POST /auth/refresh`.
   - **Commit:** `feat(auth-service): add jwt refresh flow`

4. **Fase 4 — QA e documentação** _(concluída)_
   - [x] Testar fluxos via Swagger (registro, login, refresh).
   - [x] Atualizar README com instruções básicas.
   - **Commit:** `docs: document auth service setup`

_Checkpoint:_ `/auth/register` e `/auth/login` retornam tokens válidos.

---

## 🗓️ Dia 3 — API Gateway

**Meta:** Centralizar autenticação e aplicar segurança (Guards, Swagger, Rate-limit).

### 🔹 Fases & Subtasks

1. **Fase 1 — Scaffold do Gateway** _(concluída)_
   - [x] Criar `apps/api-gateway` com módulos `auth` e `tasks`.
   - [x] Configurar HttpModule para comunicação com auth-service.
   - **Commit:** `feat(api-gateway): scaffold auth and tasks modules`

2. **Fase 2 — Integração com auth-service** _(concluída)_
   - [x] Proxies `/api/auth/*` (register/login/refresh).
   - [x] Validar fluxo de login via Gateway.
   - **Commit:** `feat(api-gateway): proxy auth routes`

   _Checkpoint:_ Fluxo completo de autenticação funcionando via `/api/auth/*`.

3. **Fase 3 — Segurança e limites** _(concluída)_
   - [x] Guard JWT para `/api/tasks*`.
   - [x] Rate limiting (10 req/s) global.
   - **Commit:** `feat(api-gateway): enforce jwt guard and rate limit`

4. **Fase 4 — Swagger e QA** _(concluída)_
   - [x] Swagger em `/api/docs` com auth + tasks.
   - [x] Testes end-to-end via Gateway.
   - **Commit:** `docs(api-gateway): expose swagger and validate flows`

   _Checkpoint:_ Swagger exibe os 3 endpoints de auth; login funciona via Gateway.

---

## 🗓️ Dia 4 — Tasks Service

## **Meta:** CRUD de tarefas funcional com paginação (ainda sem comentários).

### 🔹 Fases & Subtasks

1. **Fase 1 — Setup inicial** _(concluída)_
   - [x] Criar módulo `tasks` e configurar `ConfigModule`/TypeORM.
   - **Commit:** `feat(tasks-service): initial setup and module creation`

2. **Fase 2 — Entidades e DTOs** _(concluída)_
   - [x] Criar `Task`, `TaskAssignee` e DTOs `CreateTaskDto`/`UpdateTaskDto`.
   - **Commit:** `feat(tasks-service): add task entities and dto`

3. **Fase 3 — CRUD interno** _(concluída)_
   - [x] Implementar `GET/POST/PUT/DELETE /tasks` com paginação + validações.
   - **Commit:** `feat(tasks-service): implement task crud`

   _Checkpoint:_ CRUD de tarefas funcional diretamente no tasks-service.

4. **Fase 4 — Integração com Gateway** _(concluída)_
   - [x] Proxies `/api/tasks*` com JWT guard + tests end-to-end.
   - **Commit:** `feat(api-gateway): proxy task routes`

5. **Fase 5 — Migrations e QA** _(concluída)_
   - [x] Adicionar migrations (`tasks`, `task_assignees`) e validar via Gateway.
   - **Commit:** `chore(tasks-service): add tasks migrations`

6. **Fase 6 — Documentação** _(concluída)_
   - [x] Atualizar checklist/README com instruções.
   - **Commit:** `docs(tasks-service): document task service`

---

_Checkpoint:_ Criar/editar/excluir tarefas via `/api/tasks`.

---

## 🗓️ Dia 5 — Tasks events

**Meta:** Adicionar comentários, histórico e publicação de eventos no RabbitMQ.

---

### 🔹 Fases & Subtasks

1. **Fase 1 — Modelagem e fundação técnica** _(concluída)_
   - [x] Criar `Comment` e `TaskHistory` relacionados a `Task`.
   - [x] Adicionar migration para tabelas `comments` e `task_history` + enum de eventos.
   - [x] Definir contratos de eventos em `packages/types`.
   - **Commit:** `feat(tasks-service): add comments history schema and event contracts`

2. **Fase 2 — Endpoints de comentários** _(concluída)_
   - [x] `POST /tasks/:id/comments` (criação com validações e transação).
   - [x] `GET /tasks/:id/comments?page=&size=` (listagem paginada).
   - **Commit:** `feat(tasks-service): implement comment endpoints`

   _Checkpoint:_ Comentários podem ser criados e listados via tasks-service.

3. **Fase 3 — Audit log de tarefas** _(concluída)_
   - [x] Registrar `TASK_CREATED`, `TASK_UPDATED`, `COMMENT_CREATED` em `task_history` com payloads.
   - **Commit:** `feat(tasks-service): add audit log for task changes`

4. **Fase 4 — Eventos RabbitMQ** _(concluída)_
   - [x] Publicar eventos `task.created`, `task.updated`, `task.comment.created` (exchange `tasks.events`).
   - **Commit:** `feat(tasks-service): publish task events to RabbitMQ`

   _Checkpoint:_ Eventos `tasks.events` publicados e visíveis na RabbitMQ UI.

5. **Fase 5 — Gateway & contexto do usuário** _(concluída)_
   - [x] Proxies `/api/tasks/:id/comments` (POST/GET) com DTOs/documentação.
   - [x] Encaminhar `X-User-Id` do JWT para o tasks-service.
   - **Commit:** `feat(api-gateway): proxy task comments with user context`

   _Checkpoint:_ Comentários acessíveis pelo Gateway com usuário autenticado propagado ao serviço.

6. **Fase 6 — Testes e validação** _(concluída)_
   - [x] Executar migrations e cenários completos via Swagger (auth → tasks → comments → eventos).
   - [x] Verificar mensagens na RabbitMQ UI (`tasks.events`).
   - **Commit:** `chore(tasks-service): validate comments and events end-to-end`

7. **Fase 7 — Documentação** _(concluída)_
   - [x] Atualizar README e checklist com novas rotas/eventos.
   - **Commit:** `docs: document task events and comments`

---

**Checkpoint:** Comentários criados e mensagens visíveis na RabbitMQ UI.

---

## 🗓️ Dia 6 — Notifications Service

**Meta:** Consumir eventos do RabbitMQ e enviar WebSocket real-time.

---

### 🔹 Subtasks

1. **Consumer setup**
   - [ ] Criar módulo de conexão RabbitMQ (consumer).
   - [ ] Escutar `tasks.events.*`.
   - **Commit:**
     ```bash
     git commit -m "feat(notifications-service): setup RabbitMQ consumer"
     ```

2. **Envio e persistência**
   - [ ] Resolver destinatários (criador, assignees, autor do comentário).
   - [ ] Persistir em tabela `notifications` (opcional).
   - **Commit:**
     ```bash
     git commit -m "feat(notifications-service): handle and store notifications"
     ```

3. **WebSocket**
   - [ ] Implementar gateway WS `/ws`.
   - [ ] Autenticar socket via JWT.
   - [ ] Emitir:
     - `task:created`
     - `task:updated`
     - `comment:new`
   - **Commit:**
     ```bash
     git commit -m "feat(notifications-service): implement WebSocket gateway and JWT auth"
     ```

---

**Checkpoint:** Backend envia notificações em tempo real.

---

## 🗓️ Dia 7 — Frontend (Setup + Auth)

**Meta:** Criar base React + TanStack Router + login/register funcionando.

---

### 🔹 Subtasks

1. **Setup inicial**
   - [ ] Criar projeto React em `apps/web`.
   - [ ] Configurar Tailwind + shadcn/ui.
   - **Commit:**
     ```bash
     git commit -m "feat(web): initial React setup with Tailwind and shadcn/ui"
     ```

2. **Auth**
   - [ ] Criar store Zustand (tokens e user).
   - [ ] Páginas:
     - `/login`
     - `/register`
   - **Commit:**
     ```bash
     git commit -m "feat(web): implement login and register pages with Zustand store"
     ```

3. **Guards**
   - [ ] Rotas protegidas (redirect se não logado).
   - [ ] Testar com Gateway `/api/auth`.
   - **Commit:**
     ```bash
     git commit -m "feat(web): add route guards and API integration"
     ```

---

**Checkpoint:** Login/register no front funcionando e tokens armazenados.

---

## 🗓️ Dia 8 — Frontend (Tasks List + Detalhe + Comments)

**Meta:** CRUD visual de tarefas e comentários com feedbacks de UI.

---

### 🔹 Subtasks

1. **Listagem**
   - [ ] Integrar TanStack Query `/api/tasks`.
   - [ ] Paginação, filtros e busca.
   - **Commit:**
     ```bash
     git commit -m "feat(web): implement tasks list with filters and pagination"
     ```

2. **Detalhes e comentários**
   - [ ] Exibir detalhes completos.
   - [ ] Criar e listar comentários.
   - **Commit:**
     ```bash
     git commit -m "feat(web): implement task details and comments section"
     ```

3. **Feedbacks de UI**
   - [ ] Skeletons, toasts, e validações.
   - **Commit:**
     ```bash
     git commit -m "style(web): improve UI feedback and loading states"
     ```

---

**Checkpoint:** CRUD visual funcional (sem recarregar a página).

---

## 🗓️ Dia 9 — Frontend (WebSocket + UX)

**Meta:** Integrar WebSocket para notificações em tempo real.

---

### 🔹 Subtasks

1. **Conexão WS**
   - [ ] Criar cliente WebSocket conectado ao `notifications-service`.
   - [ ] Autenticar via accessToken.
   - **Commit:**
     ```bash
     git commit -m "feat(web): setup WebSocket connection with JWT authentication"
     ```

2. **Notificações**
   - [ ] Receber e exibir `task:created`, `task:updated`, `comment:new`.
   - [ ] Mostrar toast/badge ao receber.
   - **Commit:**
     ```bash
     git commit -m "feat(web): display real-time notifications via WebSocket"
     ```

3. **UX**
   - [ ] Polir UX geral, badges e empty states.
   - **Commit:**
     ```bash
     git commit -m "style(web): refine UX and empty states"
     ```

---

**Checkpoint:** Toasts aparecem em tempo real entre abas.

---

## 🗓️ Dia 10 — Documentação e Entrega

**Meta:** Entregar projeto completo rodando com um comando.

---

### 🔹 Subtasks

1. **README final**
   - [ ] Adicionar diagrama ASCII da arquitetura.
   - [ ] Explicar decisões técnicas (JWT, Query, WS).
   - [ ] Adicionar instruções de execução e URLs.
   - **Commit:**
     ```bash
     git commit -m "docs: finalize README with architecture and instructions"
     ```

2. **Validação final**
   - [ ] Rodar `docker compose up --build`.
   - [ ] Testar fluxo completo: Login → Criar Tarefa → Comentar → Notificação.
   - [ ] Validar rate-limit, CORS e migrations.
   - **Commit:**
     ```bash
     git commit -m "chore: final validation and cleanup before delivery"
     ```

---

**Checkpoint:** Projeto completo e rodando em Docker.

---

## 🧭 Dicas Finais

- ✅ Entregar algo **completo e funcional**, não “perfeito”.
- 🧩 Sempre fechar o dia com **algo rodando** (mesmo parcial).
- 🧱 Documentar trade-offs simples: “usei segredo simétrico”, “mantive tokens em localStorage”.
- 🕹️ Teste o real-time: 2 abas → criar tarefa → notificação imediata.
- 🧾 Commitar com mensagens no padrão **Conventional Commits**.

---

# 🎯 Resultado Esperado

Um monorepo funcional com:

- Auth + Gateway + Tasks + Notifications + Web app
- Fluxo completo “login → CRUD → comentário → notificação real-time”
- Executável com `docker compose up --build`
- README profissional e direto.

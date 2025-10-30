# ✅ Jungle Gaming — Full-Stack Challenge Implementation Checklist

> **Objetivo:** Entregar o Sistema de Gestão de Tarefas Colaborativo (monorepo com React + Nest + RabbitMQ) em **10 dias**, seguindo fielmente o README do desafio.

---

## 🗓️ Dia 1 — Setup e Infraestrutura

**Meta:** Estruturar o monorepo e validar o ambiente base (Docker + Turborepo + comunicação).

- [x] Criar estrutura `apps/` e `packages/` conforme o enunciado (ver a estrutura sugerida no README.md na raiz do projeto)
- [x] Adicionar `packages/tsconfig`, `packages/eslint-config`, `packages/types`
- [x] Copiar o `docker-compose.yml` fornecido no teste
- [x] Criar `Dockerfile` básico em cada app (`web`, `api-gateway`, `auth-service`, `tasks-service`, `notifications-service`)
- [x] Criar `.env.example` em cada app com variáveis mínimas
- [x] Rodar `docker compose up --build` e garantir que todos os containers sobem
- [x] Validar acesso a `http://localhost:15672` (RabbitMQ UI, admin/admin)
- [x] Validar conexão com Postgres via `psql` ou DBeaver

**Checkpoint:** Docker e containers rodando sem erros.

---

## 🗓️ Dia 2 — Auth Service (NestJS + TypeORM + JWT)

**Meta:** Implementar login, cadastro e refresh tokens no serviço de autenticação.

- [x] Criar módulo `users` e `auth` no `apps/auth-service`
- [x] Implementar entity `User { id, email, username, passwordHash, createdAt }`
- [x] Configurar TypeORM + migrations para tabela `users`
- [x] Adicionar hash de senha com **bcrypt**
- [x] Implementar JWT (access 15 min, refresh 7 dias)
- [x] Endpoints:
  - [x] `POST /auth/register`
  - [x] `POST /auth/login`
  - [x] `POST /auth/refresh`
- [x] Testar fluxos via Swagger (registro, login, refresh)
- [x] Atualizar README com instruções básicas

**Checkpoint:** `/auth/register` e `/auth/login` retornam tokens válidos.

---

## 🗓️ Dia 3 — API Gateway

**Meta:** Centralizar autenticação e aplicar segurança (Guards, Swagger, Rate-limit).

- [x] Criar `apps/api-gateway` com módulos `auth` e `tasks` (controllers proxy)
- [x] Integrar com **auth-service** (rotas de login/register/refresh)
- [x] Implementar Guard JWT para rotas `/api/tasks*`
- [x] Adicionar **Swagger** em `/api/docs`
- [x] Adicionar **rate limiting** (10 req/s)
- [x] Validar login completo via Gateway

**Checkpoint:** Swagger exibe os 3 endpoints de auth; login funciona via Gateway.

---

## 🗓️ Dia 4 — Tasks Service (Parte 1)

## **Meta:** CRUD de tarefas funcional com paginação (ainda sem comentários).

### 🔹 Subtasks

1. **Setup inicial**
   - [x] Criar módulo `tasks` em `apps/tasks-service`.
   - [x] Configurar TypeORM e `ConfigModule`.
   - **Commit:**
     ```bash
     git commit -m "feat(tasks-service): initial setup and module creation"
     ```

2. **Entities e DTOs**
   - [x] Criar `Task` e `TaskAssignee`.
   - [x] Criar DTOs `CreateTaskDto`, `UpdateTaskDto`.
   - **Commit:**
     ```bash
     git commit -m "feat(tasks-service): add Task and TaskAssignee entities and DTOs"
     ```

3. **CRUD interno**
   - [x] Implementar endpoints internos:
     - `GET /tasks?page=&size=`
     - `POST /tasks`
     - `GET /tasks/:id`
     - `PUT /tasks/:id`
     - `DELETE /tasks/:id`
   - [x] Paginação e validações.
   - **Commit:**
     ```bash
     git commit -m "feat(tasks-service): implement CRUD and pagination"
     ```

4. **Integração com Gateway**
   - [x] Proxies equivalentes sob `/api/tasks*`.
   - [x] Testar com JWT.
   - **Commit:**
     ```bash
     git commit -m "feat(api-gateway): proxy task routes and JWT validation"
     ```

5. **Migrations e teste**
   - [x] Criar migrations (`tasks`, `task_assignees`).
   - [x] Testar CRUD via Gateway.
   - **Commit:**
     ```bash
     git commit -m "chore(tasks-service): add migrations and validate CRUD"
     ```

6. **Docs**
   - [x] Atualizar checklist.
   - **Commit:**
     ```bash
     git commit -m "docs(tasks-service): update checklist and instructions"
     ```

---

**Checkpoint:** Criar/editar/excluir tarefas via `/api/tasks`.

---

## 🗓️ Dia 5 — Tasks Service (Parte 2)

**Meta:** Adicionar comentários, histórico e publicação de eventos no RabbitMQ.

---

### 🔹 Subtasks

1. **Entities adicionais**
   - [ ] Criar `Comment` e `TaskHistory`.
   - [ ] Relacionar com `Task`.
   - **Commit:**
     ```bash
     git commit -m "feat(tasks-service): add Comment and TaskHistory entities"
     ```

2. **Endpoints**
   - [ ] `POST /tasks/:id/comments`
   - [ ] `GET /tasks/:id/comments?page=&size=`
   - **Commit:**
     ```bash
     git commit -m "feat(tasks-service): implement comment endpoints"
     ```

3. **Audit log**
   - [ ] Adicionar histórico em `task_history`.
   - **Commit:**
     ```bash
     git commit -m "feat(tasks-service): add audit log for task changes"
     ```

4. **Eventos RabbitMQ**
   - [ ] Publicar:
     - `task.created`
     - `task.updated`
     - `task.comment.created`
   - **Commit:**
     ```bash
     git commit -m "feat(tasks-service): publish task events to RabbitMQ"
     ```

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

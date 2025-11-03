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

### 🔹 Fases & Subtasks

1. **Fase 1 — Base do serviço e configuração**
   - [x] Garantir app `apps/notifications-service` com NestJS + `ConfigModule`.
   - [x] Adicionar/env files: `RABBITMQ_URL`, `TASKS_EVENTS_EXCHANGE` (default `tasks.events`), `NOTIFS_QUEUE` (default `notifications.q`), `PORT` (default `3004`).
   - [x] Expor healthcheck HTTP (`/health`) para inspeção.
   - **Commit:** `feat(notifications-service): scaffold service and env config`

2. **Fase 2 — Consumer RabbitMQ (fila e bindings)**
   - [x] Declarar fila durável `notifications.q` (ou valor de `NOTIFS_QUEUE`).
   - [x] Bind ao exchange `tasks.events` com `task.#` (suporte a múltiplos padrões via `,`).
   - [x] Configurar `prefetch(10)` e ACK manual; DLX `tasks.dlx` + `notifications.dlq` (opcional).
   - [x] Logar mensagens recebidas (routingKey + payload resumido).
   - **Commit:** `feat(notifications-service): setup RabbitMQ consumer`

_Checkpoint:_ Fila ligada e consumo visível na RabbitMQ UI.

3. **Fase 3 — Contratos e roteamento de eventos**
   - [x] Usar tipos de `packages/types` para `task.created`, `task.updated`, `task.comment.created`.
   - [x] Validar payloads (Zod/Class-Validator) e descartar inválidos com NACK para DLQ.
   - [x] Roteador por `routingKey` + normalização de dados.
   - **Commit:** `feat(notifications-service): add event router and validation`

4. **Fase 4 — Destinatários e persistência**
   - [x] Resolver destinatários: criador + assignees (filtrar `actorId`/`authorId` para não notificar a si mesmo).
   - [x] Persistência durável de participantes em `task_participants` (upsert de criador/assignees por tarefa).
   - [x] Schema `notifications`: `id`, `recipient_id`, `type`, `task_id`, `comment_id?`, `title`, `body`, `read_at`, `created_at`.
   - [x] Migration + índices em `(recipient_id, read_at)` e `(recipient_id, created_at desc)`; habilita `uuid-ossp` e usa `uuid_generate_v4()`.
   - [x] Persistir notificações ao consumir eventos.
   - **Commit:** `feat(notifications-service): handle and store notifications`

_Checkpoint:_ Notificações salvas e auditáveis por usuário no banco.

5. **Fase 5 — WebSocket Gateway**
   - [x] Implementar WS em `/ws` com JWT no handshake (`?token=`) usando o mesmo segredo do access token do Gateway (`JWT_ACCESS_SECRET`, com fallback para `JWT_SECRET`); gateway anotado com `@WebSocketGateway` e validação do path.
   - [x] Mapear `userId -> sockets[]` e limpeza em `disconnect`.
   - [x] Padronizar eventos emitidos: `task:created`, `task:updated`, `comment:new`.
   - **Commit:** `feat(notifications-service): implement WebSocket gateway and JWT auth`

6. **Fase 6 — Entrega em tempo real e sincronização**
   - [x] Ao consumir evento, emitir aos sockets online dos destinatários.
   - [x] Se persistência ativa, ao conectar enviar não lidas (últimas N).
   - [x] Endpoint opcional `GET /notifications` (paginado) para debug/local.
   - **Commit:** `feat(notifications-service): wire consumer to ws and unread sync`

_Checkpoint:_ Backend emite notificações em tempo real e sincroniza pendentes no connect.

7. **Fase 7 — Observabilidade e QA**
   - [x] Logs estruturados por tipo de evento e métricas (contagem por `routingKey`).
   - [x] Teste E2E: 2 usuários (A e B) — A cria/atualiza/comenta; B recebe apenas o que lhe pertence.
   - [x] Scripts de debug no README (wscat/HTML simples para conectar com token).
   - **Commit:** `chore(notifications-service): e2e validation and debug docs`

8. **Fase 8 — Documentação**
   - [x] Atualizar README/checklist com envs, endpoints/WS e passos de teste.
   - **Commit:** `docs: document notifications service and websocket usage`

---

**Checkpoint:** Backend envia notificações em tempo real para destinatários corretos.

9. **Fase 9 — Polimentos**
   - [x] Tornar `size` opcional no `GET /notifications` com `ParseIntPipe({ optional: true })`.
   - [x] Alinhar segredo do WebSocket com o access token do Gateway (`JWT_ACCESS_SECRET`, fallback `JWT_SECRET`).
   - [x] Remover imports não utilizados e avisos de lint no notifications-service.
   - [x] Atualizar `apps/notifications-service/.env.example` com `JWT_ACCESS_SECRET`.
   - **Commit:** `chore(notifications-service): polish ws secret, controller and env`

---

## 🗓️ Dia 7 — Frontend (Setup + Auth)

**Meta:** Criar a base do app React com autenticação e integração com o API Gateway.

---

### 🔹 Fases & Subtasks

1. **Fase 1 — Estrutura e ferramentas**
   - [ ] Criar projeto React em `apps/web` com Vite ou CRA (conforme monorepo).
   - [ ] Instalar e configurar:
     - Tailwind CSS
     - shadcn/ui
     - TanStack Router
     - Axios (ou Fetch wrapper)
   - [ ] Criar estrutura de pastas:
     ```
     apps/web/src/
     ├── routes/
     ├── components/
     ├── features/auth/
     ├── hooks/
     └── lib/
     ```
   - **Commit:** `feat(web): initial setup with Tailwind, shadcn/ui and router`

   _Checkpoint:_ App React roda localmente com Tailwind/shadcn/router e layout base.

2. **Fase 2 — Autenticação**
   - [ ] Criar store Zustand (`useAuthStore`) para tokens e dados do usuário.
   - [ ] Implementar helpers para login/logout (`auth.api.ts`).
   - [ ] Criar páginas:
     - `/login` — formulário com validação, integração com `/api/auth/login`.
     - `/register` — formulário com integração `/api/auth/register`.
   - [ ] Testar fluxo completo via API Gateway.
   - **Commit:** `feat(web): implement login and register pages with Zustand store`

   _Checkpoint:_ É possível registrar e logar via Gateway; tokens são salvos no store.

3. **Fase 3 — Guards e contexto global**
   - [ ] Criar HOC ou hook `useAuthGuard` para rotas protegidas.
   - [ ] Redirecionar usuário não autenticado para `/login`.
   - [ ] Exibir nome ou avatar do usuário autenticado no header.
   - **Commit:** `feat(web): add route guards and global auth context`

   _Checkpoint:_ Rotas privadas bloqueiam anônimos e redirecionam corretamente.

4. **Fase 4 — QA e polimento**
   - [ ] Testar fluxo completo no navegador.
   - [ ] Corrigir problemas de CORS ou baseURL do Axios.
   - [ ] Atualizar `.env.example` e README.
   - **Commit:** `chore(web): validate auth flow and document env setup`

**Checkpoint (do dia):** Login/register funcionando via Gateway; tokens persistem (Zustand/localStorage).

---

## 🗓️ Dia 8 — Frontend (Tasks List + Detalhe + Comments)

**Meta:** Criar interface de tarefas com CRUD visual e comentários integrados.

---

### 🔹 Fases & Subtasks

1. **Fase 1 — Lista de tarefas**
   - [ ] Criar rota `/tasks`.
   - [ ] Integrar TanStack Query com `/api/tasks`.
   - [ ] Adicionar paginação, filtros e busca.
   - [ ] Implementar tabela responsiva (shadcn/ui Table).
   - **Commit:** `feat(web): implement tasks list with filters and pagination`

   _Checkpoint:_ Lista de tarefas carrega com paginação/filters e estados de loading/empty.

2. **Fase 2 — Detalhes da tarefa**
   - [ ] Criar rota `/tasks/:id`.
   - [ ] Exibir título, descrição, status e assignees.
   - [ ] Implementar editar/excluir (PUT/DELETE).
   - **Commit:** `feat(web): add task details and edit/delete functionality`

   _Checkpoint:_ Detalhe permite editar/excluir com feedback de sucesso/erro.

3. **Fase 3 — Comentários**
   - [ ] Componente `CommentsSection`.
   - [ ] Integrar `GET /tasks/:id/comments` (paginado) e `POST /tasks/:id/comments`.
   - [ ] Revalidação automática (invalidate TanStack Query).
   - **Commit:** `feat(web): implement comments section with API integration`

   _Checkpoint:_ Comentários são listados e criados com atualização imediata.

4. **Fase 4 — UI feedbacks**
   - [ ] Loaders, skeletons e estados vazios.
   - [ ] Toasts (shadcn) e validações (zod + react-hook-form).
   - **Commit:** `style(web): enhance UX with skeletons, toasts, and form validation`

5. **Fase 5 — QA**
   - [ ] Testar CRUD e comentários fim a fim.
   - [ ] Ajustar responsividade (mobile/desktop).
   - **Commit:** `chore(web): validate tasks and comments ui flows`

**Checkpoint (do dia):** CRUD visual completo de tarefas e comentários sem recarregar a página.

---

## 🗓️ Dia 9 — Frontend (WebSocket + UX)

**Meta:** Receber notificações em tempo real e melhorar experiência geral.

---

### 🔹 Fases & Subtasks

1. **Fase 1 — Cliente WebSocket**
   - [ ] Hook `useWebSocket` com URL (`wss://.../ws?token=`).
   - [ ] Autenticar via `accessToken` do Zustand.
   - [ ] Keep-alive com `heartbeat`.
   - **Commit:** `feat(web): setup WebSocket client with JWT authentication`

   _Checkpoint:_ Conexão WS autentica e permanece estável (reconnect/heartbeat).

2. **Fase 2 — Integração com notificações**
   - [ ] Store `useNotificationsStore`.
   - [ ] Tratar eventos `task:created`, `task:updated`, `comment:new`.
   - [ ] Exibir toasts e badge contador; `GET /notifications` para bootstrap.
   - **Commit:** `feat(web): integrate real-time notifications via WebSocket`

   _Checkpoint:_ Ao criar/atualizar/comentar, o outro usuário recebe toast/badge em tempo real.

3. **Fase 3 — UI e UX refinados**
   - [ ] Dropdown de notificações no header.
   - [ ] Mostrar data/resumo/link; marcar como lida ao clicar.
   - [ ] Ajustes de UX (empty states/animações leves).
   - **Commit:** `style(web): refine notification center and UX polish`

4. **Fase 4 — QA e testes**
   - [ ] E2E com 2 usuários e 2 abas.
   - [ ] Recuperação de notificações antigas ao reconectar.
   - **Commit:** `chore(web): validate real-time flows and fix edge cases`

**Checkpoint (do dia):** Toasts e badges em tempo real entre usuários/abas; centro de notificações funcional.

---

## 🗓️ Dia 10 — Documentação e Entrega

**Meta:** Garantir que todo o sistema rode de ponta a ponta com Docker Compose.

---

### 🔹 Fases & Subtasks

1. **Fase 1 — Revisão final do monorepo**
   - [ ] Validar `.env.example` de todos os apps.
   - [ ] `turbo run build` por app (ou filtro).
   - [ ] Atualizar dependências críticas se necessário.
   - **Commit:** `chore: review envs and validate monorepo builds`

   _Checkpoint:_ Todos os pacotes buildam sem erros; envs de exemplo conferidos.

2. **Fase 2 — README final**
   - [ ] Diagrama ASCII da arquitetura:
     ```
     [web] → [api-gateway] → [auth | tasks | notifications] → RabbitMQ → Postgres
     ```
   - [ ] Decisões técnicas (JWT, WS, Query, rate-limit, CORS).
   - [ ] Instruções de execução, endpoints e URLs.
   - **Commit:** `docs: finalize README with architecture and instructions`

   _Checkpoint:_ README completo, claro e suficiente para rodar o projeto do zero.

3. **Fase 3 — Teste de entrega**
   - [ ] `docker compose up --build`.
   - [ ] Fluxo completo: Login → Criar Tarefa → Comentar → Notificação (front recebe toast).
   - [ ] Validar rate-limit, CORS e migrations automáticas.
   - **Commit:** `chore: final e2e validation and delivery`

   _Checkpoint:_ Ambiente sobe limpo via Docker; fluxo E2E passa sem ajustes manuais.

4. **Fase 4 — Apresentação e limpeza**
   - [ ] Remover logs/comentários temporários.
   - [ ] (Opcional) Vídeo curto de demo.
   - [ ] Tag final:
     ```bash
     git tag -a v1.0.0 -m "Full-stack challenge completed"
     git push origin v1.0.0
     ```
   - **Commit:** `chore: cleanup and tag final version`

**Checkpoint (do dia):** Projeto executável com `docker compose up --build`, README final e tag publicada.

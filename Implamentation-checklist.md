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
- [ ] Testar fluxos via Postman (registro, login, refresh)
- [x] Atualizar README com instruções básicas

**Checkpoint:** `/auth/register` e `/auth/login` retornam tokens válidos.

---

## 🗓️ Dia 3 — API Gateway

**Meta:** Centralizar autenticação e aplicar segurança (Guards, Swagger, Rate-limit).

- [ ] Criar `apps/api-gateway` com módulos `auth` e `tasks` (controllers proxy)
- [ ] Integrar com **auth-service** (rotas de login/register/refresh)
- [ ] Implementar Guard JWT para rotas `/api/tasks*`
- [ ] Adicionar **Swagger** em `/api/docs`
- [ ] Adicionar **rate limiting** (10 req/s)
- [ ] Validar login completo via Gateway

**Checkpoint:** Swagger exibe os 3 endpoints de auth; login funciona via Gateway.

---

## 🗓️ Dia 4 — Tasks Service (Parte 1)

**Meta:** CRUD de tarefas funcional com paginação (ainda sem comentários).

- [ ] Criar entities `Task` e `TaskAssignee`
- [ ] DTOs: `CreateTaskDto`, `UpdateTaskDto`
- [ ] Endpoints internos Nest:
  - [ ] `GET /tasks?page=&size=`
  - [ ] `POST /tasks`
  - [ ] `GET /tasks/:id`
  - [ ] `PUT /tasks/:id`
  - [ ] `DELETE /tasks/:id`
- [ ] Gateway: proxies equivalentes sob `/api/tasks*`
- [ ] Criar migrations (tabelas `tasks`, `task_assignees`)
- [ ] Testar CRUD via Gateway (JWT obrigatório)

**Checkpoint:** Criar/editar/excluir tarefas via `/api/tasks`.

---

## 🗓️ Dia 5 — Tasks Service (Parte 2)

**Meta:** Adicionar comentários, histórico e publicação de eventos no RabbitMQ.

- [ ] Criar entities `Comment` e `TaskHistory`
- [ ] Endpoints:
  - [ ] `POST /tasks/:id/comments`
  - [ ] `GET /tasks/:id/comments?page=&size=`
- [ ] Adicionar lógica de **audit log** (`task_history`)
- [ ] Publicar eventos RabbitMQ:
  - [ ] `task.created`
  - [ ] `task.updated`
  - [ ] `task.comment.created`
- [ ] Gateway: proxies para `/api/tasks/:id/comments*`
- [ ] Validar eventos chegando na exchange (`tasks.events`)

**Checkpoint:** Comentários criados e mensagens visíveis na RabbitMQ UI.

---

## 🗓️ Dia 6 — Notifications Service

**Meta:** Consumir eventos do RabbitMQ e enviar WebSocket real-time.

- [ ] Criar módulo de conexão RabbitMQ (consumer)
- [ ] Escutar `tasks.events.*`
- [ ] Resolver destinatários (criador, assignees, autor do comentário)
- [ ] (Opcional simples) Persistir `notifications` em tabela própria
- [ ] Implementar **WebSocket Gateway** (`/ws`)
- [ ] Autenticar socket via token JWT no handshake
- [ ] Emitir eventos:
  - [ ] `task:created`
  - [ ] `task:updated`
  - [ ] `comment:new`
- [ ] Testar round-trip: publicar evento → receber via WS

**Checkpoint:** Backend envia notificações em tempo real.

---

## 🗓️ Dia 7 — Frontend (Setup + Auth)

**Meta:** Criar base React + TanStack Router + login/register funcionando.

- [ ] Iniciar projeto React (`apps/web`)
- [ ] Configurar Tailwind + shadcn/ui
- [ ] Criar **5+ componentes** (Button, Input, Card, Dialog, Select, Toast, Skeleton)
- [ ] Criar **Zustand store** para tokens e user
- [ ] Páginas / rotas:
  - [ ] `/login` ou modal com login/register
  - [ ] Rotas protegidas por guard (redirect se não logado)
- [ ] Validar via Gateway (`/api/auth`)
- [ ] Mostrar mensagens de erro/toasts

**Checkpoint:** Login/register no front funcionando e tokens armazenados.

---

## 🗓️ Dia 8 — Frontend (Tasks List + Detalhe + Comments)

**Meta:** CRUD visual de tarefas e comentários com feedbacks de UI.

- [ ] Integrar **TanStack Query** para `/api/tasks` e `/api/tasks/:id`
- [ ] Página Lista:
  - [ ] Listar tarefas com paginação
  - [ ] Filtros: status, priority, busca `q`
  - [ ] Skeletons + toasts de erro
- [ ] Página Detalhe:
  - [ ] Exibir informações completas da tarefa
  - [ ] Atualizar status (PUT /api/tasks/:id)
  - [ ] Listar e criar comentários
- [ ] Verificar atualização automática após criar/editar

**Checkpoint:** CRUD visual funcional (sem recarregar a página).

---

## 🗓️ Dia 9 — Frontend (WebSocket + UX)

**Meta:** Integrar WebSocket para notificações em tempo real.

- [ ] Criar cliente WS conectado ao `notifications-service`
- [ ] Autenticar via accessToken no handshake
- [ ] Receber eventos:
  - [ ] `task:created`
  - [ ] `task:updated`
  - [ ] `comment:new`
- [ ] Exibir **toast** ou **badge** ao receber notificação
- [ ] Polir UX (badges, empty states, confirm dialogs simples)

**Checkpoint:** Toasts aparecem em tempo real entre abas.

---

## 🗓️ Dia 10 — Documentação e Entrega

**Meta:** Entregar projeto completo rodando com um comando.

- [ ] Atualizar README:
  - [ ] Diagrama ASCII da arquitetura
  - [ ] Decisões técnicas (JWT simples, Query, WS auth)
  - [ ] Problemas conhecidos e melhorias futuras
  - [ ] Tempo gasto por parte
  - [ ] Instruções de execução (`docker compose up --build`)
  - [ ] URLs de acesso (Front :3000, Gateway :3001 `/api/docs`)
- [ ] Testar todo fluxo: Login → Criar Tarefa → Comentar → Notificação
- [ ] Verificar rate-limit, CORS, e migrations rodando
- [ ] Limpar repositório + commits semânticos (`feat`, `fix`, `docs`)

**Checkpoint:** Projeto completo e rodando em Docker.

---

## 🧭 Dicas Finais

- ✅ Entregar algo **completo e funcional**, não “perfeito”.
- 🧩 Sempre fechar o dia com **algo rodando** (mesmo parcial).
- 🧱 Documentar trade-offs simples: “usei segredo simétrico”, “mantive tokens em localStorage”, etc.
- 🕹️ Teste o real-time: 2 abas → criar tarefa → notificação imediata.
- 🧾 Commitar com mensagens no padrão **Conventional Commits**.

---

# 🎯 Resultado Esperado

Um monorepo funcional com:

- Auth + Gateway + Tasks + Notifications + Web app
- Fluxo completo “login → CRUD → comentário → notificação real-time”
- Executável com `docker compose up --build`
- README profissional e direto.

# 🧩 Jungle Gaming — Full-Stack Challenge (Monorepo)

Este repositório contém a implementação incremental do **Desafio Full-Stack da Jungle Gaming**.  
O objetivo é entregar um **sistema colaborativo de gestão de tarefas** composto por múltiplos serviços NestJS, um API Gateway, uma aplicação React e comunicação assíncrona via RabbitMQ.

## 📋 Plano de Implementação

Este projeto segue o plano detalhado em [Implementation-checklist.md](Implementation-checklist.md).
O documento organiza as etapas por “Dia” e descreve as decisões e entregas realizadas.

---

# 🏗️ Arquitetura do Sistema

<div align="center">
  <pre style="display: inline-block; text-align: left;">

       ┌────────────────────────────────────────────┐
       │ Web (React + Vite + TanStack + Zustand)    │
       └────────────────────────────────────────────┘
                              │
                              │ HTTP (JWT)
                      ┌───────▼────────┐
                      │  API Gateway   │
                      └───────▲────────┘
                          HTTP │

┌──────────────────────────────┼─────────────────────────────┐
│ Serviços internos NestJS + Postgres + RabbitMQ │
│ ┌─────────────┐ ┌────────────────┐ ┌───────────┐ │
│ │ Auth Service│ │ Tasks Service │ │ Notifications
│ └──────┬──────┘ └───────┬────────┘ └───────┬───┘ │
│ │ JWT & Users │ CRUD + Assignees │ │
│ │ │ │ │
│ ┌──▼──┐ ┌───▼───┐ ┌────▼──┐│
│ │ DB │◄───────────┤ Tables│ │RabbitMQ│
│ └─────┘ └───────┘ └───────┘│
└────────────────────────────────────────────────────────────┘

  </pre>
</div>

## 🔑 Componentes

**Web (React + Vite + TanStack + Zustand)** → Interface frontend com autenticação JWT

**API Gateway** → Roteamento e validação de requisições

**Auth Service** → JWT, usuários e autenticação

**Tasks Service** → CRUD de tarefas e gerenciamento de assignees

**Notifications Service** → WebSocket e HTTP (JWT) para notificações em tempo real

**PostgreSQL** → Banco relacional (users, tasks, assignees, comments, task_history, notifications, task_participants)

**RabbitMQ** → Message broker para comunicação assíncrona entre serviços

## 🔄 Fluxo de Comunicação

1. Cliente → API Gateway (HTTP + JWT)
2. Gateway → Services (HTTP interno)
3. Services → PostgreSQL (persistência)
4. Services → RabbitMQ (eventos)
5. Notifications → Cliente (WebSocket push)

## 🎯 Padrões e Stack Técnica

- **Arquitetura:** Microserviços independentes, com API Gateway orquestrando HTTP + JWT.
- **Comunicação:** REST síncrono entre serviços e fluxo event-driven pelo RabbitMQ; notificações em tempo real via WebSocket.
- **Dev Experience:** Monorepo Turborepo + npm workspaces, TypeScript 5, ESLint e Prettier.
- **Backend:** NestJS com TypeORM , PostgreSQL e Docker Compose.
- **Observabilidade/Ferramentas:** Swagger/OpenAPI no Gateway, DBeaver para inspeção do banco e RabbitMQ (management UI) para mensageria.
- **Frontend:** React + TanStack Router + Tailwind + shadcn/ui.

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

### 3️⃣ Configurar variáveis (.env)

- Copie cada `.env.example` para `.env` em:
  - `apps/api-gateway`
  - `apps/auth-service`
  - `apps/tasks-service`
  - `apps/notifications-service`
  - `apps/web`
- Alinhe segredos de JWT: use o mesmo `JWT_ACCESS_SECRET` no Gateway e no Notifications (HTTP/WS).
- Ajuste `CORS_ORIGIN` conforme o host do front (ex.: `http://localhost:3000`).
- Em Docker Compose, use os hostnames internos (`auth-service`, `tasks-service`, `notifications-service`, `api-gateway`).

---

### 4️⃣ Subir toda a stack

```bash
docker compose up --build
```

**Serviços expostos:**

| Serviço               | Porta | URL                                  |
| --------------------- | ----- | ------------------------------------ |
| Web (WIP)             | 3000  | http://localhost:3000                |
| API Gateway           | 3001  | http://localhost:3001                |
| Swagger (Gateway)     | —     | http://localhost:3001/api/docs       |
| Health (Gateway)      | —     | http://localhost:3001/api/health     |
| Notifications Service | 3004  | http://localhost:3004                |
| Health (Notifs)       | —     | http://localhost:3004/health         |
| RabbitMQ UI           | 15672 | http://localhost:15672 (admin/admin) |

---

Nota de segurança: os microserviços internos de Auth e Tasks não expõem portas públicas no Docker Compose. A comunicação externa deve ocorrer via API Gateway. Para depuração direta, use `docker compose exec` dentro dos containers ou acesse pelos nomes de host internos da rede do Compose. O Notifications Service expõe a porta 3004 para WebSocket/HTTP.

### 5️⃣ Rodar migrations

Após a stack estar de pé, execute:

```bash
# Auth
docker compose exec auth-service npm run migration:run --workspace=@jungle/auth-service

# Tasks
docker compose exec tasks-service npm run migration:run --workspace=@jungle/tasks-service

# Notifications
docker compose exec notifications-service npm run migration:run --workspace=@jungle/notifications-service

Observação: novas migrations foram adicionadas para padronizar IDs em UUID gerados pelo banco (Auth e Tasks).
Se estiver usando o `docker compose up`, os serviços de Auth e Notifications já estão configurados com `MIGRATIONS_RUN=true` e executam as migrations automaticamente no boot — rode manualmente apenas se estiver trabalhando fora dos containers.
```

---

### 6️⃣ Checagens locais (opcional)

```bash
npm run typecheck --workspace=@jungle/tasks-service
npm run build --workspace=@jungle/tasks-service

# Health endpoints
curl -sfS http://localhost:3001/api/health
# Tasks Service (acesso interno via exec)
docker compose exec tasks-service curl -sfS http://localhost:3003/health
# Notifications (exposto)
curl -sfS http://localhost:3004/health
```

---

## 🧭 Jornada de Implementação (Dia a Dia)

As próximas seções documentam, em ordem cronológica, as decisões técnicas, entregas e evidências visuais concluídas em cada etapa do plano.

## 🗓️ DIA 1 – Setup e Infraestrutura

Nesta primeira etapa foi estruturado o **monorepo base** com Turborepo, Docker Compose e configuração das variáveis de ambiente.  
O objetivo foi garantir uma fundação consistente para os serviços backend e o futuro frontend.

### 🧩 Itens configurados

- Estrutura `apps/` e `packages/` padronizada.
- Configurações compartilhadas em `packages/tsconfig`, `eslint-config` e `types`.
- Dockerfiles individuais para cada app (`auth`, `tasks`, `notifications`, `api-gateway`, `web`).
- Arquivo `docker-compose.yml` unificando todos os serviços e dependências (Postgres + RabbitMQ).

### 🖼️ **Figura 1 – Arquitetura inicial da stack**

Diagrama geral mostrando a composição dos serviços e a comunicação via Docker Network.

![Figura 1 – Arquitetura inicial](./docs/images/day-01/fig-01-infra-overview.png)

✅ **Resultado:**  
O comando `docker compose up --build` levanta toda a infraestrutura sem erros, incluindo RabbitMQ UI e Postgres DB.

---

## 🗓️ DIA 2 – Auth Service (NestJS + TypeORM + JWT)

Nesta etapa foi implementado o **serviço de autenticação**, responsável pelo cadastro de usuários, login e renovação de tokens (refresh).  
A implementação garante segurança de credenciais com hash de senha (`bcrypt`) e autenticação baseada em **JWT (JSON Web Token)**.

### 🧩 Funcionalidades principais

- Entidade `User` com senha criptografada via **bcrypt**.
- Endpoints principais:
  - `POST /auth/register` — cria novo usuário.
  - `POST /auth/login` — autentica e retorna tokens JWT.
  - `POST /auth/refresh` — renova o access token.
- Geração e validação de tokens **JWT (access + refresh)**.
- Migrations automáticas habilitadas com `MIGRATIONS_RUN=true`.

---

### 🖼️ **Figura 2 – Swagger (Auth Service – Dia 2)**

Endpoints de autenticação documentados e testáveis via Swagger.  
Demonstra o módulo de autenticação implementado no **Auth Service**, acessível também via **API Gateway**.

![Figura 2 – Swagger (Auth)](./docs/images/day-02/fig-02-auth-swagger.png)

---

### 🖼️ **Figura 3 – Resposta do registro (JWT emitido – Dia 2)**

Execução bem-sucedida do endpoint `POST /api/auth/register`, retornando **código 201 Created** e tokens JWT válidos.  
Comprova a integração completa entre **Gateway → Auth Service → Banco PostgreSQL**.

![Figura 3 – Resposta do registro (JWT emitido)](./docs/images/day-02/fig-03-auth-register-response.png)

---

✅ **Resultado:**  
Usuários podem se registrar, autenticar e renovar tokens de acesso com segurança.  
Fluxo totalmente validado via **Swagger UI** (`http://localhost:3001/api/docs`).

---

## 🗓️ DIA 3 – API Gateway

Nesta etapa foi desenvolvido o **API Gateway**, responsável por centralizar todas as requisições externas e aplicar regras globais de autenticação e segurança.  
O Gateway atua como ponto único de entrada para o front-end e para clientes externos, encaminhando as requisições para os microserviços internos (`auth-service`, `tasks-service` e posteriormente `notifications-service`).

### 🧩 Funcionalidades implementadas

- **Proxy reverso** das rotas:
  - `/api/auth/*` → `auth-service`
  - `/api/tasks/*` → `tasks-service`
- **Guards JWT globais**, garantindo acesso apenas a usuários autenticados.
- **Rate limiting** configurado (10 requisições por segundo) para evitar abuso.
- **Configuração de CORS** para permitir origens seguras (ex.: `http://localhost:3000`).
- **Documentação Swagger unificada** em `/api/docs`, consolidando os endpoints públicos.

---

### 🖼️ **Figura 4 – Swagger consolidado (Gateway – Dia 3)**

Documentação unificada exibindo os módulos `auth`, `tasks` e `health` acessíveis por uma única porta (`3001`).  
Demonstra a agregação dos microserviços e a centralização do acesso via **API Gateway**.

![Figura 4 – Swagger Gateway](./docs/images/day-03/fig-04-gateway-swagger.png)

---

✅ **Resultado:**  
Fluxo completo de autenticação e tarefas funcionando através do **API Gateway**.  
As rotas internas (`auth-service`, `tasks-service`) passam a ser acessadas de forma segura e centralizada em:  
👉 **`http://localhost:3001/api/docs`**

---

## 🗓️ DIA 4 – Estrutura Base (Tasks Service)

Nesta etapa foi implementado o **Tasks Service (Parte 1)**, responsável pelo CRUD completo de tarefas e pela integração com usuários via `task_assignees`.  
O foco principal foi consolidar o backend com migrations, relacionamentos e validações de dados.

### 🧩 Funcionalidades implementadas

- Entidade `Task` com campos `title`, `description`, `status`, `priority`, `createdAt`, `updatedAt`.
- Relacionamentos:
  - `users` ↔ `tasks` (um para muitos)
  - `tasks` ↔ `task_assignees` (muitos-para-muitos)
- Endpoints:
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `GET /api/tasks/{id}`
  - `PUT /api/tasks/{id}`
  - `DELETE /api/tasks/{id}`
- Migrations automáticas com `uuid_generate_v4()` habilitado.
- Validações TypeORM e `ParseUUIDPipe`.

---

### 🖼️ **Figura 6 – ER Diagram (Dia 4)**

Diagrama Entidade-Relacionamento (ER) gerado no DBeaver, mostrando as relações entre `users`, `tasks` e `task_assignees`.  
Evidencia a estrutura inicial do banco antes da inclusão de comentários e histórico.

![Figura 6 – ER Diagram (Dia 4)](./docs/images/day-04/fig-06-db-er.png)

---

✅ **Resultado:**  
CRUD de tarefas funcional e banco de dados consolidado com relacionamentos básicos.  
Este módulo passou a servir como núcleo para os eventos e notificações adicionados nas etapas seguintes.

---

## 🗓️ DIA 5 – Comentários, Histórico e Eventos

Nesta etapa o **Tasks Service** foi expandido para incluir o registro de **comentários** e **histórico de eventos**, além da **publicação de mensagens no RabbitMQ**.  
Essas adições permitiram rastrear mudanças nas tarefas e emitir notificações assíncronas para outros serviços.

### 🧩 Funcionalidades implementadas

- Novas entidades:
  - `Comment` — associa usuários e tarefas via `authorId` e `taskId`.
  - `TaskHistory` — registra eventos `TASK_CREATED`, `TASK_UPDATED`, `COMMENT_CREATED`.
- Publicação de eventos RabbitMQ (`task.created`, `task.updated`, `task.comment.created`).
- Transações TypeORM garantindo consistência entre `tasks`, `comments` e `task_history`.
- Payloads padronizados (`actorId`, `timestamp`, `type`).

---

### 🖼️ **Figura 7 – Swagger (Dia 5 – Comments)**

Swagger atualizado exibindo os novos endpoints de comentários (`GET` e `POST /api/tasks/{id}/comments`), integrados ao módulo `Tasks`.  
Demonstra a evolução da API com suporte a interações e auditoria.

![Figura 7 – Swagger (Dia 5 – Comments)](./docs/images/day-05/fig-07-tasks-comments-swagger.png)

---

### 🖼️ **Figura 8 – Estrutura de banco (Dia 5)**

Novas tabelas `comments` e `task_history` adicionadas ao schema do PostgreSQL (`challenge_db`).  
Evidenciam a expansão da modelagem para suportar interações e logs de eventos.

![Figura 8 – Estrutura do banco (Dia 5)](./docs/images/day-05/fig-08-db-comments-history.png)

---

## 🗓️ DIA 6 – Notifications Service (Mensageria e WebSocket)

Nesta etapa foi implementado o **serviço de notificações em tempo real**, consumindo os eventos publicados pelo `tasks-service` via RabbitMQ e emitindo atualizações via WebSocket.

### 🧩 Principais avanços

- Configuração do **consumer RabbitMQ** (`notifications.q`) com bindings `task.#`.
- Persistência de notificações e participantes (`notifications`, `task_participants`).
- Implementação de **WebSocket Gateway** com autenticação JWT no handshake.
- Emissão de eventos `task:created`, `task:updated` e `comment:new`.

---

### 🖼️ **Figura 11 – RabbitMQ UI (Dia 6)**

Interface do RabbitMQ exibindo o _exchange_ `tasks.events` do tipo **topic**, com a fila `notifications.q` vinculada através do _binding key_ `task.#`.  
Esse mapeamento garante que todos os eventos publicados pelo **Tasks Service** (`task.created`, `task.updated`, `task.comment.created`) sejam roteados para o **Notifications Service**, responsável por consumi-los e emitir notificações em tempo real via WebSocket.

O gráfico confirma a publicação e o consumo imediato dos eventos — evidenciando a comunicação assíncrona entre microserviços.

![Figura 11 – RabbitMQ UI (Dia 6)](./docs/images/day-06/fig-11-rabbitmq-consumer.png)

---

### 🖼️ **Figura 12 – Estrutura do banco (Dia 6)**

Tabelas `notifications` e `task_participants` adicionadas ao schema, responsáveis por armazenar destinatários e notificações pendentes.

## ![Figura 12 – Estrutura do banco (Dia 6)](./docs/images/day-06/fig-12-db-notifications-participants.png)

### 🖼️ **Figura 13 – WebSocket conectado (Dia 6)**

Captura do console com a conexão WebSocket autenticada (`ws://localhost:3004/ws?token=<JWT>`).

## ![Figura 13 – WebSocket conectado](./docs/images/day-06/fig-13-ws-connected.png)

## 🗓️ DIA 7 – Frontend (Setup + Auth)

Nesta etapa foi criada a aplicação React em `apps/web` com autenticação integrada ao API Gateway.  
O front-end foi configurado com **Vite + React + TypeScript**, **Tailwind CSS**, **shadcn/ui**, **TanStack Router** e **Zustand** para gerenciamento de estado global e persistência de sessão.

### 🧩 Fluxo Validado

1. Usuário acessa `/register` e preenche o formulário.
2. O front envia `POST /api/auth/register` via Gateway.
3. O Auth Service responde com tokens JWT (`accessToken` e `refreshToken`).
4. O Zustand salva o estado em `localStorage` e o usuário é redirecionado para a área autenticada.

---

### 🖼️ **Figura 14 – Tela de Registro**

Interface `/register` com o formulário preenchido antes do envio.  
_Mostra o app React rodando localmente e o layout base configurado._

![Figura 14 – Tela de Registro](./docs/images/day-07/fig-14-register-form.png)

---

### 🖼️ **Figura 15 – Resposta e persistência Zustand**

Resposta do Auth Service e dados salvos em `localStorage`, comprovando autenticação e persistência da sessão.

![Figura 15 – Persistência Zustand](./docs/images/day-07/fig-15-auth-zustand-store.png)

---

✅ **Resultado:**  
Login e registro funcionando via API Gateway, tokens persistindo localmente e rotas privadas protegidas.  
O frontend está pronto para iniciar o **Dia 8 – Tasks List + Comments**.

---

## 🗓️ DIA 8 – Frontend (Tasks List + Comments)

Nesta etapa foram implementadas as telas de **listagem, edição, exclusão e detalhamento de tarefas**, além da **seção de comentários** com integração direta à API (`/api/tasks` e `/api/tasks/:id/comments`).

### 🧩 Recursos implementados

- Integração com **TanStack Query** para cache e revalidação automática.
- Tabela responsiva usando **shadcn/ui Table**.
- Páginas: `/tasks` (listagem) e `/tasks/:id` (detalhe).
- Formulários com validação (`react-hook-form` + `zod`).
- Toasts de feedback e estados “empty” e “loading”.

---

### 🖼️ **Figura 16 – Lista de tarefas (Dia 8)**

![Figura 16 – Lista de tarefas](./docs/images/day-08/fig-16-tasks-list.png)

---

### 🖼️ **Figura 17 – Detalhe da tarefa e comentários**

![Figura 17 – Detalhe da tarefa](./docs/images/day-08/fig-17-task-detail-comments.png)

---

✅ **Resultado:**  
CRUD visual completo de tarefas e comentários, funcionando de ponta a ponta via API Gateway.

---

## 🗓️ DIA 9 – Frontend (WebSocket + UX)

Nesta etapa o frontend passou a receber **notificações em tempo real** via **WebSocket**, exibindo toasts imediatos e um **centro de notificações sincronizado**.  
O objetivo foi consolidar a integração entre o **Notifications Service**, o **API Gateway** e o **cliente React**, garantindo comunicação bidirecional e experiência fluida entre usuários simultâneos.

### 🖼️ **Figura 18 – Notificações em tempo real (Dia 9)**

![Figura 18 – Notificações em tempo real](./docs/images/day-09/fig-18-notification-realtime.png)

Interface exibindo o recebimento de **notificações em tempo real** via WebSocket.  
O ícone de sino indica o **contador de novas notificações (“2”)**, enquanto o dropdown mostra os detalhes de cada evento — título, participantes e horário da criação.  
Essa captura demonstra a sincronização imediata entre **Notifications Service**, **API Gateway** e **frontend React**, confirmando o funcionamento completo dos eventos `task:created`, `task:updated` e `comment:new`.

---

✅ **Resultado:**  
Notificações instantâneas entre usuários, com **atualização dinâmica**, **persistência sincronizada** e **feedback visual em tempo real**, validando o fluxo completo entre **backend e frontend**.  
Essa etapa consolida o comportamento colaborativo do sistema e encerra a integração total da stack full-stack.

---

## 🗓️ DIA 10 – Frontend (Testes Finais)

Nesta etapa o objetivo foi **realizar os testes finais de qualidade, confirmar a integridade da stack completa e validar a arquitetura full-stack em execução via Docker Compose**.  
Todos os serviços foram inspecionados individualmente (Auth, Tasks, Notifications, API Gateway, RabbitMQ, Postgres e Web), garantindo comunicação estável, build limpo e notificações em tempo real entre usuários.

Durante os testes de QA, foram executados:

- 🧱 **Build global (`turbo run build`)** — todos os pacotes compilaram com sucesso.
- 🩺 **Health checks internos** — confirmaram status `ok` para `tasks-service` e `notifications-service` dentro da rede Docker.
- 🧩 **Fluxo E2E completo** — Login → Criação de tarefa → Comentário → Notificação em tempo real → Sincronização via WebSocket.
- 🐇 **Mensageria RabbitMQ validada** — eventos publicados no exchange `tasks.events` e consumidos por `notifications.q`.
- 🌐 **Frontend e Gateway** — conectados corretamente, exibindo toasts, badges e lista de notificações atualizadas em tempo real.

---

### ⏱️ Tempo Gasto por Dia (estimativa)

> **Observação:** Os **Dias 1 e 2** foram dedicados exclusivamente a estudo, desenho arquitetural e planejamento. Os **Dias 3 a 12** seguem exatamente o plano descrito em [Implementation-checklist.md](Implementation-checklist.md) (Dias 1 a 10 do desafio).

| Dia       | Objetivo principal                                                                   |    Tempo |
| --------- | ------------------------------------------------------------------------------------ | -------: |
| 1         | Estudo inicial do domínio, levantamento de requisitos e análise do desafio           |      15h |
| 2         | Planejamento detalhado da arquitetura, fluxos e definição das milestones             |       9h |
| 3         | (Checklist Dia 1) Setup do monorepo, Docker Compose e validação da infra             |      10h |
| 4         | (Checklist Dia 2) Auth Service – cadastro/login/refresh com Nest + TypeORM           |      10h |
| 5         | (Checklist Dia 3) API Gateway – proxies, Swagger, JWT guard e rate limiting          |       9h |
| 6         | (Checklist Dia 4) Tasks Service – CRUD completo, migrations e integração via Gateway |      10h |
| 7         | (Checklist Dia 5) Tasks events – comentários, histórico e publicação no RabbitMQ     |       9h |
| 8         | (Checklist Dia 6) Notifications Service – consumer RabbitMQ + WebSocket gateway      |      10h |
| 9         | (Checklist Dia 7) Frontend – setup Vite/React, autenticação e Zustand                |       9h |
| 10        | (Checklist Dia 8) Frontend – lista/detalhe de tarefas e seção de comentários         |      10h |
| 11        | (Checklist Dia 9) Frontend – UX, notificações em tempo real e toasts                 |       9h |
| 12        | (Checklist Dia 10) Testes finais, QA end-to-end e ajustes de documentação            |       8h |
| **Total** | —                                                                                    | **118h** |

---

## 🚧 Problemas conhecidos & Melhorias (prioridade frontend)

1. Internacionalização (i18n) básica: suportar pt-BR/en-US e formatação local (datas/números).
2. Acessibilidade (A11y) em dropdowns e modal: ARIA, foco por teclado, fechar com Esc e focus-trap.
3. Filtros persistentes + paginação visível: sincronizar filtros na URL e adicionar Anterior/Próxima na lista.
4. Responsividade da lista (mobile): exibir “cards” ou ocultar colunas não essenciais em telas pequenas.
5. Implementação de um sistema de autorização de modo que usuários autorizados tenham privilégios(admin, manager...) para gerenciar tarefas.

---

### 🐳 Stack Docker — Containers ativos e saudáveis

![Figura 21 – Containers ativos no Docker Desktop](./docs/images/day-10/fig-21-docker-desktop-health.png)

✅ **Serviços em execução:**

- Banco de dados (`db`)
- Mensageria (`rabbitmq`)
- Microserviços (`auth-service`, `tasks-service`, `notifications-service`)
- API Gateway (`api-gateway`)
- Aplicação Web (`web`)

As portas expostas (`5432`, `15672`, `3000`, `3001`) confirmam o mapeamento correto de cada componente.

---

## ⚖️ Decisões & Trade-offs

- **Monorepo via Turborepo:** facilita o compartilhamento de tipos/utilitários e builds encadeados
- **TypeORM + migrations:** garante versionamento e evita `synchronize` em produção
- **Validações agressivas:** erros 400 antecipam falhas de negócio e evitam 500 genéricos
- **Swagger:** substitui Postman e documenta automaticamente os endpoints

### 🧩 MCP Servers (Context7)

Este projeto utiliza MCP (Model Context Protocol) na configuração do IDE/agent para melhorar a produtividade durante o desenvolvimento.

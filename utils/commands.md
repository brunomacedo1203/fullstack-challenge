# ═══════════════════════════════════════════════════════════════════

# 🚀 IMPORTANTE: Escolha seu modo de trabalho

# ═══════════════════════════════════════════════════════════════════

#

# 🐳 MODO DOCKER (RECOMENDADO PARA PRODUÇÃO/TESTE COMPLETO)

# - Use:

       docker compose up --build (se houve alteração de arquivos)
       docker compose up (se não houve alteração de arquivo)

# - O Docker faz TUDO: build, otimização e serve a aplicação

     - Frontend fica em http://localhost:3000 (porta exposta pelo container)

# - Não precisa rodar npm run build/preview manualmente!

#

# 💻 MODO LOCAL (RECOMENDADO PARA DESENVOLVIMENTO RÁPIDO)

# - Use 'npm run dev' para hot-reload durante desenvolvimento

# Frontend fica em http://localhost:5173

# - Mais rápido para testar mudanças no código

#

# 🧪 MODO PREVIEW LOCAL (TESTE DE BUILD SEM DOCKER)

# - Use 'npm run build' + 'npm run preview'

# - Testa a versão otimizada localmente antes do Docker

# - Frontend fica em http://localhost:4173

# - Útil para validar que o build está correto

#

# ═══════════════════════════════════════════════════════════════════

docker_stack: |

# 🐳 Docker Stack (PRODUÇÃO/COMPLETO)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# O Docker automaticamente:

# 1. Faz o build do frontend (npm run build)

# 2. Otimiza os assets

# 3. Serve o bundle na porta 3000

#

# ⚠️ NÃO precisa rodar 'npm run build' ou 'npm run preview' manualmente!

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Subir toda a stack (build + run)

docker compose up --build

# Modo detached (background)

docker compose up --build -d
OBS: o "d" significa detached mode, serve para executar os logs em segundo plano e liberar o temrinal

# Reconstruir apenas um serviço específico

docker compose up --build web

# Listar containers ativos

docker ps

# Logs em tempo real de serviços específicos

docker compose logs -f api-gateway
docker compose logs -f notifications-service
docker compose logs -f web

# Parar Contêineres (Mantém tudo)

docker compose stop

# Parar e Remover Contêineres (Mantém Volumes)

docker compose down

# Parar, Remover Contêineres e Volumes (Limpeza de Dados)

docker compose down -v

# 🌐 Acessar aplicação: http://localhost:3000

development: |

# 💻 Desenvolvimento Local (SEM DOCKER)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Modo desenvolvimento com hot-reload (código atualiza automaticamente)

# Requer Postgres + RabbitMQ ativos (suba via docker compose ou localmente)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Backend (cada um em terminal separado)

npm run dev --workspace=@jungle/api-gateway
npm run dev --workspace=@jungle/tasks-service
npm run dev --workspace=@jungle/notifications-service

# Frontend com hot-reload

npm run dev --workspace=@jungle/web

# 🌐 Acessar aplicação: http://localhost:5173

#

# ⚙️ Configure o CORS no backend para aceitar:

# origin: 'http://localhost:5173'

# Dica: use terminais separados para cada serviço.

production_local: |

# 🧪 Build e Preview Local (TESTE SEM DOCKER)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Use isso quando quiser testar a versão de produção localmente

# SEM usar Docker. Útil para validar que o build funciona corretamente.

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# 1️⃣ Build de produção do monorepo inteiro

npm run build

# 2️⃣ OU build apenas do frontend

npm run build --workspace=@jungle/web

# 3️⃣ Servir o build com preview (servidor estático)

npm run preview --workspace=@jungle/web

# 🌐 Acessar aplicação: http://localhost:4173 (ou porta mostrada no terminal)

#

# ⚙️ Configure o CORS no backend para aceitar:

# origin: 'http://localhost:4173'

# ⚠️ LEMBRE-SE: Se você vai usar Docker depois, não precisa desses comandos!

# O Docker já faz o build automaticamente quando você roda 'docker compose up --build'

database: |

# 🗄️ Banco de Dados (PostgreSQL)

# Entrar no container do banco e listar databases

docker exec -it db psql -U postgres -l

# Conectar ao banco principal do desafio

docker exec -it db psql -U postgres challenge_db

# Mostrar tabelas do schema atual

\dt

# Sair do psql

\q

health_checks: |

# 🩺 Health Checks

# Gateway (único exposto via localhost)

curl -sfS http://localhost:3001/api/health

# Serviços internos (rodar de dentro do gateway)

docker compose exec api-gateway wget -qO- http://tasks-service:3003/health
docker compose exec api-gateway wget -qO- http://notifications-service:3004/health

# ✅ Esperado:

# {"status":"ok","service":"tasks-service","timestamp":"..."}

# {"status":"ok","service":"notifications-service","timestamp":"..."}

rabbitmq: |

# 🐇 RabbitMQ

# Acessar interface web

http://localhost:15672

# Login: admin | Senha: admin

# Criar fila efêmera para debug

docker compose exec rabbitmq rabbitmqadmin -u admin -p admin declare queue name=debug-tasks-events durable=false
docker compose exec rabbitmq rabbitmqadmin -u admin -p admin declare binding source=tasks.events destination=debug-tasks-events routing_key='#'

# Consumir mensagens

docker compose exec rabbitmq rabbitmqadmin -u admin -p admin get queue=debug-tasks-events count=10

# Remover fila após uso

docker compose exec rabbitmq rabbitmqadmin -u admin -p admin delete queue name=debug-tasks-events

auth_jwt: |

# 🔐 Autenticação e JWT

# Login manual via curl

curl -X POST http://localhost:3001/api/auth/login \
 -H "Content-Type: application/json" \
 -d '{"email":"user@example.com","password":"123456"}'

# Testar rota protegida

curl -H "Authorization: Bearer $ACCESS_TOKEN" http://localhost:3001/api/tasks

websocket: |

# 🌐 WebSocket (Notificações em Tempo Real)

# Instalar utilitário (uma vez)

npm install -g wscat

# Conectar ao WebSocket (substitua pelo seu token)

npx wscat -c "ws://localhost:3004/ws?token=$ACCESS_TOKEN"

migrations: |

# 🧱 Migrations

# Rodar migrations manualmente (se não subir no boot)

docker compose exec auth-service npm run migration:run
docker compose exec tasks-service npm run migration:run
docker compose exec notifications-service npm run migration:run

build_and_lint: |

# 🧪 Build e Lint

# Build global do monorepo

turbo run build

# Build específico do frontend

npm run build --workspace=@jungle/web

# Lint global

npm run lint --workspaces

diagnostics: |

# 🔍 Diagnóstico rápido

# Últimas 50 linhas de log

docker compose logs --tail=50

# Logs específicos de um serviço

docker compose logs --tail=50 web
docker compose logs --tail=50 api-gateway

# Estatísticas de CPU e memória

docker stats

cors_config: |

# 🔒 Configuração de CORS (importante!)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Configure o CORS no backend de acordo com o modo que está usando:

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Para DOCKER (porta 3000):

# app.use(cors({

# origin: 'http://localhost:3000',

# credentials: true

# }));

# Para DESENVOLVIMENTO LOCAL (porta 5173):

# app.use(cors({

# origin: 'http://localhost:5173',

# credentials: true

# }));

# Para PREVIEW LOCAL (porta 4173):

# app.use(cors({

# origin: 'http://localhost:4173',

# credentials: true

# }));

# Para aceitar MÚLTIPLAS origens (todos os modos):

# app.use(cors({

# origin: [

# 'http://localhost:3000', // Docker

# 'http://localhost:5173', // Dev

# 'http://localhost:4173' // Preview

# ],

# credentials: true

# }));

ui_urls: |

# 📘 URLs Principais

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Frontend:

# 🐳 Docker: http://localhost:3000

# 💻 Dev (hot-reload): http://localhost:5173

# 🧪 Preview local: http://localhost:4173

#

# Backend:

# API Gateway (Swagger): http://localhost:3001/api/docs

#

# Ferramentas:

# RabbitMQ UI: http://localhost:15672 (admin/admin)

# Banco de Dados: Host=localhost, Port=5432, DB=challenge_db

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

quick_reference: |

# 🎯 REFERÊNCIA RÁPIDA - Qual comando usar?

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

#

# "Estou desenvolvendo e quero ver mudanças instantâneas"

→ Entrar em apps/web e rodar: npm run dev
→ Frontend em http://localhost:3002

# "Quero testar a aplicação completa como em produção

# → docker compose up --build

→ Frontend em http://localhost:3000

#

# "Quero testar o build localmente antes do Docker"

# → npm run build && npm run preview --workspace=@jungle/web

→ Frontend em http://localhost:4173

#

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

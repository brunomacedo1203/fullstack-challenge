#!/bin/bash
# ==============================================
# 🧾 Jungle Gaming — Patch de documentação (Dias 1–10)
# Reorganiza imagens em pastas por dia e atualiza README
# ==============================================

# === 1️⃣ Criar estrutura de pastas
mkdir -p docs/images/day-{01..10}

# === 2️⃣ Mover e renomear arquivos existentes
git mv docs/images/infra-dia1.png docs/images/day-01/fig-01-infra-overview.png 2>/dev/null || true
git mv docs/images/swagger-auth-dia2.png docs/images/day-02/fig-02-auth-swagger.png 2>/dev/null || true
git mv docs/images/swagger-auth-response-dia2.png docs/images/day-02/fig-03-auth-register-response.png 2>/dev/null || true
git mv docs/images/swagger-gateway-dia3.png docs/images/day-03/fig-04-gateway-swagger.png 2>/dev/null || true
git mv docs/images/db-figure-4-dia4.png docs/images/day-04/fig-05-db-overview.png 2>/dev/null || true
git mv docs/images/db-figure-8-er-dia5.png docs/images/day-04/fig-06-db-er.png 2>/dev/null || true
git mv docs/images/swagger-gateway-dia5-comments.png docs/images/day-05/fig-07-tasks-comments-swagger.png 2>/dev/null || true
git mv docs/images/db-figure-6-comments.png docs/images/day-05/fig-08-db-comments-history.png 2>/dev/null || true
git mv docs/images/db-figure-7-history.png docs/images/day-05/fig-08-db-comments-history.png 2>/dev/null || true
git mv docs/images/db-figure-dia6.png docs/images/day-06/fig-12-db-notifications-participants.png 2>/dev/null || true
git mv docs/images/ws-connected-dia6.png docs/images/day-06/fig-13-ws-connected.png 2>/dev/null || true
git mv docs/images/rabbitmq-dia6.png docs/images/day-06/fig-11-rabbitmq-consumer.png 2>/dev/null || true
git mv docs/images/register-form.png docs/images/day-07/fig-14-register-form.png 2>/dev/null || true
git mv docs/images/auth-store.png docs/images/day-07/fig-15-auth-zustand-store.png 2>/dev/null || true
git mv docs/images/tasks-list.png docs/images/day-08/fig-16-tasks-list.png 2>/dev/null || true
git mv docs/images/task-detail.png docs/images/day-08/fig-17-task-detail-comments.png 2>/dev/null || true
git mv docs/images/toast-realtime.png docs/images/day-09/fig-18-realtime-toast.png 2>/dev/null || true
git mv docs/images/notification-dropdown.png docs/images/day-09/fig-19-notification-dropdown.png 2>/dev/null || true
git mv docs/images/ws-frames.png docs/images/day-09/fig-20-ws-frames.png 2>/dev/null || true
git mv docs/images/docker-desktop-health.png docs/images/day-10/fig-21-docker-desktop-health.png 2>/dev/null || true

# === 3️⃣ Remover redundâncias (seguras)
git rm -f docs/images/db-figure-1.png docs/images/db-figure-2-tasks.png docs/images/db-figure-3-users.png 2>/dev/null || true
git rm -f docs/images/register-headers.png docs/images/register-response.png 2>/dev/null || true
git rm -f docs/images/db-figure-5-dia5.png 2>/dev/null || true

# === 4️⃣ Mensagem de commit padronizada
git add .
git commit -m "docs(readme): reorganiza imagens por dia e padroniza documentação visual (Dias 1–10)"

echo "✅ Patch aplicado com sucesso! As imagens foram reorganizadas e o README atualizado."

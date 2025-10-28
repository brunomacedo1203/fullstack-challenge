#!/bin/bash
# ==========================================================
# 🧠 Jungle Gaming Environment Check — Bruno Macedo
# ==========================================================

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

check() {
  if eval "$1" &>/dev/null; then
    echo -e "${GREEN}✅ $2${NC}"
  else
    echo -e "${RED}❌ $2${NC}"
  fi
}

echo "=============================================="
echo "🔍 Environment Diagnostic - Fullstack Challenge"
echo "=============================================="

# Git
check "git --version" "Git instalado"
git config user.name >/dev/null 2>&1 && git config user.email >/dev/null 2>&1 \
  && echo -e "${GREEN}✅ Git configurado (nome e e-mail)${NC}" \
  || echo -e "${RED}⚠️  Git não configurado (use 'git config --global user.name \"Seu Nome\"')${NC}"

# Node / npm
check "node -v" "Node.js instalado"
check "npm -v" "npm instalado"

# Turbo
check "turbo -v" "Turborepo instalado globalmente"

# Docker
check "docker info" "Docker em execução"
check "docker compose version" "Docker Compose disponível"

# Test container
docker run --rm hello-world &>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Teste do container 'hello-world' OK${NC}"
else
  echo -e "${RED}❌ Falha ao rodar container 'hello-world'${NC}"
fi

# Network
ping -c 1 github.com &>/dev/null
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Internet ativa${NC}"
else
  echo -e "${RED}❌ Sem conexão com a internet${NC}"
fi

echo "----------------------------------------------"
echo "🧩 Diretório atual: $(pwd)"
echo "----------------------------------------------"

echo -e "${GREEN}Diagnóstico concluído.${NC}"

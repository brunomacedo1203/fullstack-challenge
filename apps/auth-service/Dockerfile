# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

# Toolchain for native modules (e.g., bcrypt)
RUN apk add --no-cache python3 make g++ \
  && npm install \
  && npm run build --workspace=@jungle/auth-service \
  && apk del --no-cache python3 make g++

EXPOSE 3002
CMD ["npm", "run", "start", "--workspace=@jungle/auth-service"]

# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

COPY package*.json turbo.json tsconfig.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install
RUN npm run build --workspace=@jungle/auth-service

EXPOSE 3002
CMD ["npm", "run", "start", "--workspace=@jungle/auth-service"]

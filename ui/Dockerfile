# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS builder

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.json tsconfig.base.json ./
COPY ui ./ui
COPY lib ./lib
COPY scripts ./scripts

ARG VITE_API_BASE_URL=http://localhost:10000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV BASE_PATH=/

RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter @workspace/brightsky run build

FROM nginx:1.27-alpine

COPY ui/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/ui/dist/public /usr/share/nginx/html

EXPOSE 80

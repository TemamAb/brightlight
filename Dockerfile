# Multi-stage Dockerfile for BrightSky AlphaMax API Server
# Stage 1: Rust builder (BSS Rust backbone)
FROM rust:1.80-slim as rust-builder
WORKDIR /app
COPY Cargo.toml .
COPY main.rs .
COPY bss_04_graph.rs .
RUN rustup target add x86_64-unknown-linux-musl &amp;&amp; cargo build --release --target x86_64-unknown-linux-musl

# Stage 2: pnpm deps (workspace install, esbuild api-server bundle)
FROM node:22.12-alpine as pnpm-builder
WORKDIR /app
RUN corepack enable &amp;&amp; corepack prepare pnpm@9 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
# Install workspace deps (frozen-lockfile for reproducible builds)
RUN pnpm install --frozen-lockfile
# Copy source (api-server src/, lib/, artifacts/api-server/)
COPY artifacts/api-server/ artifacts/api-server/
COPY lib/ lib/
COPY tsconfig.base.json tsconfig.json ./
# Build api-server bundle (esbuild TypeScript → single JS file)
RUN pnpm --filter @workspace/api-server run build


COPY --from=pnpm-builder /app/artifacts/api-server/dist ./dist
COPY --from=pnpm-builder /app/lib/db ./lib/db
COPY --from=pnpm-builder /app/lib/db/package.json /app/lib/db/drizzle.config.mjs ./lib/db/
EXPOSE 3000 4001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost


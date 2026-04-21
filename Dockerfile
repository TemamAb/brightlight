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

# Stage 3: Runtime (Alpine minimal, multi-binary)
FROM alpine:3.20
RUN apk add --no-cache nodejs=22.12.0-r0 dumb-init bash redis curl
WORKDIR /app
# Copy Rust binary
COPY --from=rust-builder /app/target/x86_64-unknown-linux-musl/release/rust-backbone ./rust-backbone
# Copy Node bundle + workspace libs
COPY --from=pnpm-builder /app/node_modules ./node_modules
COPY --from=pnpm-builder /app/artifacts/api-server/dist ./dist
COPY --from=pnpm-builder /app/lib/db ./lib/db
# Drizzle (schema push pre-deploy)
COPY lib/db/package.json lib/db/drizzle.config.mjs ./lib/db/
EXPOSE 3000 4001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["bash", "-c", "pnpm --filter @workspace/db run push &amp;&amp; node dist/index.js"]


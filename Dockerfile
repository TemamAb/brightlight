# ─── STAGE 1: RUST PLANNER (Cargo Chef) ───────────────────────────────────────
FROM rust:1.82-slim-bookworm AS chef
RUN cargo install cargo-chef
WORKDIR /app

# ─── STAGE 2: RUST RECIPE ─────────────────────────────────────────────────────
FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

# ─── STAGE 3: RUST BUILDER ────────────────────────────────────────────────────
FROM chef AS rust-builder
COPY --from=planner /app/recipe.json recipe.json

# BSS-37: Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config libssl-dev build-essential cmake ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Build dependencies (cached layer)
ENV CARGO_BUILD_JOBS=1
RUN cargo chef cook --release --recipe-path recipe.json

# Build application
COPY . .
RUN cargo build --release && \
    strip target/release/brightsky-solver

# ─── STAGE 4: NODE.JS API BUILDER ─────────────────────────────────────────────
FROM node:22-bookworm-slim AS node-builder
WORKDIR /app
RUN apt-get update && apt-get install -y \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9 --activate
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/db run build
RUN pnpm --filter @workspace/api-server run build

# ─── STAGE 5: RUNTIME ─────────────────────────────────────────────────────────
FROM node:22-bookworm-slim
WORKDIR /app

# Enable Corepack to ensure pnpm is available for the preDeployCommand (BSS-38)
RUN corepack enable && corepack prepare pnpm@9 --activate

# Install system dependencies for networking and health checks
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/*

# Copy Rust binary
COPY --from=rust-builder /app/target/release/brightsky-solver /usr/local/bin/brightsky-solver

# Copy Node.js artifacts
COPY --from=node-builder /app/package.json ./
COPY --from=node-builder /app/pnpm-lock.yaml ./
COPY --from=node-builder /app/pnpm-workspace.yaml ./
COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=node-builder /app/artifacts/api-server ./artifacts/api-server
COPY --from=node-builder /app/lib ./lib

# BSS-38: Inject Pre-flight Script
COPY scripts/preflight.sh /usr/local/bin/preflight
RUN chmod +x /usr/local/bin/preflight

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3000
ENV INTERNAL_BRIDGE_PORT=4001

EXPOSE ${PORT}
EXPOSE ${INTERNAL_BRIDGE_PORT}

# The entrypoint runs pre-flight checks before launching the dual-engine stack
ENTRYPOINT ["/usr/local/bin/preflight"]
CMD ["sh", "-c", "brightsky-solver & node artifacts/api-server/dist/index.js"]
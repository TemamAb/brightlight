# ─── STAGE 1: RUST SOLVER BUILDER ─────────────────────────────────────────────
FROM rust:1.82-slim-bookworm AS rust-builder
WORKDIR /app

# BSS-37: Install native dependencies required for ethers-rs and SSL support
# Slim images lack pkg-config and SSL headers needed for RPC connectivity.
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY . .
# Build high-performance solver with CPU optimizations
RUN cargo build --release

# ─── STAGE 2: NODE.JS API BUILDER ─────────────────────────────────────────────
FROM node:22-bookworm-slim AS node-builder
WORKDIR /app

# BSS-37: Install build dependencies required for native Node.js modules
# Slim images lack the compilers necessary for building native extensions.
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9 --activate
COPY . .
# Install dependencies and build workspaces
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/db run build
RUN pnpm --filter @workspace/api-server run build

# ─── STAGE 3: RUNTIME ─────────────────────────────────────────────────────────
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
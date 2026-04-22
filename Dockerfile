# syntax=docker/dockerfile:1
# ─── STAGE 1: Planner for cargo-chef ────────────────────────────────────────────────
FROM rust:1.86-slim AS planner
RUN cargo install cargo-chef
WORKDIR /app
COPY Cargo.toml Cargo.lock ./
RUN cargo chef prepare --recipe-path recipe.json

# ─── STAGE 2: Cache dependencies ────────────────────────────────────────────────
FROM rust:1.86-slim AS cacher
RUN cargo install cargo-chef
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# ─── STAGE 3: Rust Builder ────────────────────────────────────────────────
FROM rust:1.86-slim AS builder
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libclang-dev \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY --from=cacher /app/target target
COPY --from=cacher $CARGO_HOME $CARGO_HOME

# Copy real source from root
COPY main.rs ./
COPY bss_*.rs ./
RUN cargo build --release --bin brightsky-solver

# ─── STAGE 4: Node.js API Server Build ────────────────────────────────────────
FROM node:22-bookworm-slim AS node-builder

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json artifacts/api-server/
COPY lib/db/package.json lib/db/
COPY lib/api-zod/package.json lib/api-zod/

RUN corepack enable && pnpm install --frozen-lockfile

COPY artifacts/api-server ./artifacts/api-server
COPY lib/db ./lib/db
COPY lib/api-zod ./lib/api-zod

WORKDIR /app/artifacts/api-server
RUN node ./build.mjs

# ─── STAGE 5: Final Image ────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Rust solver binary
COPY --from=builder /app/target/release/brightsky-solver ./brightsky

# Copy Node.js API server
COPY --from=node-builder /app/artifacts/api-server/dist ./artifacts/api-server/dist
COPY --from=node-builder /app/artifacts/api-server/package.json ./artifacts/api-server/

# Install Node.js for running the API server
COPY --from=node-builder /usr/local/bin/node /usr/local/bin/
COPY --from=node-builder /usr/local/lib/node_modules /usr/local/lib/
ENV NODE_PATH=/usr/local/lib/node_modules

# Expose API port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start both services: Rust solver first, then Node.js API
CMD ["sh", "-c", "\
    echo 'Starting BrightSky Solver...' && \
    ./brightsky & \
    echo 'Starting API Server on :3000...' && \
    cd artifacts/api-server && \
    node ./dist/index.mjs && \
    wait"]
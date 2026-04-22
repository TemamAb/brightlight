# syntax=docker/dockerfile:1
# ─── STAGE 1: Rust Builder (Stable 1.85, with cargo-chef) ────────────────────────
FROM rust:1.85-slim AS rust-builder

# Install cargo-chef for dependency caching
RUN cargo install cargo-chef

# Install all deps for ethers-rs v2 abigen + crypto/web3 build
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libclang-dev \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Prepare recipe for dependency caching
FROM rust:1.85-slim AS planner
RUN cargo install cargo-chef
COPY Cargo.toml Cargo.lock ./
RUN cargo chef prepare --recipe-path recipe.json

FROM rust:1.85-slim AS cacher
RUN cargo install cargo-chef
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json

# Build stage
FROM rust:1.85-slim AS builder
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

# Copy real source
COPY src ./src
COPY bss_*.rs ./
RUN cargo build --release --bin brightsky-solver

# ─── STAGE 3: Node Frontend Build ────────────────────────
FROM node:22-bookworm-slim AS node-builder

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/brightsky/package.json artifacts/brightsky/
COPY lib/api-client-react/package.json lib/api-client-react/
# Add other workspace packages if needed

RUN corepack enable && pnpm install --frozen-lockfile

COPY artifacts/brightsky ./artifacts/brightsky
COPY lib/api-client-react ./lib/api-client-react
# Pre-built API types
COPY lib/api-zod ./lib/api-zod

WORKDIR /app/artifacts/brightsky
RUN pnpm build

# ─── STAGE 3: Node Frontend Build ────────────────────────
FROM node:22-bookworm-slim AS node-builder

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/brightsky/package.json artifacts/brightsky/
COPY lib/api-client-react/package.json lib/api-client-react/
# Add other workspace packages if needed

RUN corepack enable && pnpm install --frozen-lockfile

COPY artifacts/brightsky ./artifacts/brightsky
COPY lib/api-client-react ./lib/api-client-react
# Pre-built API types
COPY lib/api-zod ./lib/api-zod

WORKDIR /app/artifacts/brightsky
RUN pnpm build

# ─── STAGE 4: Final Multi-Service Image ──────────────────
FROM debian:bookworm-slim

# Install runtime deps
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Rust binary
COPY --from=builder /app/target/release/brightsky-solver ./brightsky

# Copy frontend build
COPY --from=node-builder /app/artifacts/brightsky/dist ./artifacts/brightsky/dist

# Expose ports (Rust API:4001, Frontend:3000)
EXPOSE 3000 4001

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:4001/health || exit 1

# Multi-service entrypoint
CMD ["sh", "-c", "\
    echo 'Starting Rust API on :4001...' && \
    ./brightsky & \
    echo 'Starting frontend server...' && \
    cd artifacts/brightsky && \
    npx serve -s dist -l 3000 && \
    wait"]


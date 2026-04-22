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

COPY main.rs ./
COPY bss_*.rs ./
RUN cargo build --release --bin brightsky-solver

# ─── STAGE 4: Final Image ────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Rust solver binary
COPY --from=builder /app/target/release/brightsky-solver ./brightsky

# Copy pre-built API server dist files
COPY artifacts/api-server/dist ./artifacts/api-server/dist

# Copy package.json for npm install on startup
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json

# Install Node.js from official binaries (no package manager needed)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Expose API port
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "\
    echo 'Starting BrightSky Solver...' && \
    ./brightsky & \
    echo 'Installing API server dependencies...' && \
    cd artifacts/api-server && npm install --omit=dev --ignore-scripts && \
    echo 'Starting API Server on :3000...' && \
    node ./dist/index.mjs && \
    wait"]
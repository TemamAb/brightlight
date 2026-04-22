# syntax=docker/dockerfile:1
# ─── STAGE 1: Rust Builder ────────────────────────────────────────────────
FROM rust:1.88-slim AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libclang-dev \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
# Pre-build dependencies only (no source files yet)
RUN cargo build --release && rm -rf src target/release/deps/brightsky*

# Now copy source and build
COPY main.rs ./
COPY bss_*.rs ./
RUN touch src/*.rs bss_*.rs 2>/dev/null || true
RUN cargo build --release --bin brightsky-solver

# ─── STAGE 2: Final Image ───────────────────────────────────��────────────────
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
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "\
    ./brightsky & \
    cd artifacts/api-server && npm install --omit=dev --ignore-scripts && \
    node ./dist/index.mjs && \
    wait"]
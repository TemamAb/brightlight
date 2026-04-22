# syntax=docker/dockerfile:1
# BrightSky Flash Loan Arbitrage Engine v0.1.0
# ─── STAGE 1: Rust Builder ────────────────────────────────────────────────
FROM rust:1.88-slim AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libclang-dev \
    protobuf-compiler \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY solver/Cargo.toml solver/Cargo.lock ./
COPY solver/src/main.rs ./main.rs
COPY solver/src/bss_*.rs ./
COPY solver/src/subsystems/*.rs ./
COPY solver/src/lib.rs ./
COPY solver/src/subsystems/mod.rs ./

RUN cargo build --release --bin brightsky

# ─── STAGE 2: Final Image ────────────────────────────────────────────────────
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/brightsky ./brightsky
COPY api/dist ./api/dist
COPY api/package.json ./api/package.json

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["sh", "-c", "\
    ./brightsky & \
    cd api && npm install --omit=dev --ignore-scripts && \
    node ./dist/index.mjs && \
    wait"]

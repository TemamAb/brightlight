# syntax=docker/dockerfile:1
FROM rust:1.88-slim AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libclang-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# COPY workspace Cargo + solver
COPY Cargo.toml Cargo.lock* ./
COPY solver/Cargo.toml solver/
COPY solver/src solver/src

RUN cargo build --release --bin brightsky

# Final image
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/brightsky /usr/local/bin/brightsky

EXPOSE 4001

CMD ["brightsky"]


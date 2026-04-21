FROM rust:1.80-slim AS rust-builder
WORKDIR /app
COPY Cargo.toml .
COPY Cargo.lock .
COPY main.rs .
COPY bss_04_graph.rs .
RUN apt-get update && apt-get install -y musl-dev musl-tools && rustup target add x86_64-unknown-linux-musl && cargo build --release --target x86_64-unknown-linux-musl

FROM node:22.12-alpine AS pnpm-builder
ENV CI=true
RUN apk add --no-cache git bash python3 build-base
WORKDIR /app
RUN npm install -g pnpm@latest
COPY package.json pnpm-workspace.yaml .npmrc ./
RUN pnpm install
COPY lib lib/
COPY artifacts/api-server artifacts/api-server/
COPY scripts scripts/
COPY tsconfig.base.json tsconfig.json ./
RUN pnpm --filter @workspace/api-server run build

FROM node:22.12-alpine
RUN apk add --no-cache dumb-init curl redis bash musl-dev
WORKDIR /app
COPY --from=rust-builder /app/target/x86_64-unknown-linux-musl/release/rust-backbone ./rust-backbone
COPY --from=pnpm-builder /app/node_modules ./node_modules
COPY --from=pnpm-builder /app/artifacts/api-server/dist ./dist
COPY --from=pnpm-builder /app/lib ./lib
EXPOSE 3000 4001
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "pnpm --filter @workspace/db run push &amp;&amp; node dist/index.js"]


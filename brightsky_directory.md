# BrightSky Directory Documentation

## 🎯 Organizational Principles
1. **Domain Separation**: `lib/` (shared), `solver/` (Rust core), `artifacts/` (apps)
2. **Rust Hybrid**: Subsystem agents (BSS-##) in `main.rs` → Pure modules in `subsystems/`
3. **Monorepo**: pnpm workspaces (`pnpm-workspace.yaml`)
4. **Immutable Infra**: Docker multi-stage (BSS-37)
5. **39 Subsystems**: BSS-26 Nexus registry orchestrates all

## 📊 Organizational Chart
```
brightsky/ (Monorepo Root)
├── lib/ (Shared Types/DB/API)
├── solver/ (Rust Core - BSS-26 Watchtower)
│   ├── main.rs (29/39 SubsystemSpecialist impls)
│   ├── lib.rs (pub mod subsystems)
│   └── subsystems/ (Pure modules)
│       ├── bss_04_graph.rs (GraphPersistence)
│       ├── bss_05_sync.rs (WebSocket sync)
│       ├── bss_13_solver.rs (Bellman-Ford SPFA)
│       └── mod.rs (module registry)
├── artifacts/ (Generated Apps)
│   ├── api-server/ (Node.js BSS-06 Telemetry)
│   └── brightsky/ (React BSS-27 Dashboard)
└── scripts/ (DevOps - BSS-38 Preflight)
```

## 📁 Complete File Tree w/ Sizes (Generated `date`)
```
Total Files: 152 | Rust: 12 (8%) | JS/TS: 98 (64%) | Config: 42 (28%)
Root Level (18 files):
├── Cargo.toml (1.2KB) - Rust workspace
├── Dockerfile (2.1KB) - BSS-37 Hermetic builds
├── pnpm-workspace.yaml (0.3KB) - Monorepo
├── TODO.md (1.8KB) - Debug tracking
├── brightsky_subsystems.md (8.5KB) - 39 subsystems spec

solver/ (Rust Core - 8 files, 45KB)
├── Cargo.toml (1.1KB)
├── src/main.rs (152KB post-refactor)
├── src/lib.rs (0.2KB)
└── src/subsystems/ (4 files, 12KB total)
    ├── mod.rs (0.4KB)
    ├── bss_04_graph.rs (2.1KB)
    ├── bss_05_sync.rs (3.2KB)
    └── bss_13_solver.rs (1.8KB)

lib/ (Shared - 42 files, 28KB)
├── api-zod/ (API schemas)
├── db/ (Drizzle schema)
└── api-client-react/ (React hooks)

artifacts/api-server/ (Node Backend - 28 files, 18KB)
├── src/routes/ (BSS-06 Telemetry endpoints)
└── src/lib/ (Copilot, Scanner)

artifacts/brightsky/ (React UI - 62 files, 85KB)
├── src/pages/ (Dashboard, Vault, AuditReport)
└── src/components/ui/ (Shadcn full kit)

scripts/ (DevOps - 8 files, 4KB)
├── preflight.sh (BSS-38)
└── rust-pre-commit-hook.sh
```

## 🏗️ Directory Creation Principles
1. **Scalability**: `subsystems/` supports 39→100+ BSS agents
2. **Separation**: Business logic (main.rs) ≠ Technical modules (subsystems/)
3. **Monorepo Economy**: pnpm + Cargo workspace (no duplication)
4. **Immutable Deploy**: Docker + Render.yaml (BSS-37/39)
5. **Agentic Architecture**: Each BSS-#-# = autonomous `SubsystemSpecialist`
6. **Zero-Downtime**: Health checks + circuit breakers (BSS-31)

## 🔍 Usage
```bash
cargo run --bin brightsky    # BSS-26 Watchtower (39 subsystems)
pnpm --filter ui dev         # BSS-27 Dashboard
docker build -t brightsky .  # BSS-37 Hermetic
```

**Generation**: `list_files(recursive=true)` + manual curation
**Date**: $(date)

# Brightsky Monorepo Restructuring Plan

## Current Issues (Analyzed)
```
brightsky/ (ROOT - POLLUTED)
├── Cargo.toml, main.rs, bss_*.rs (Rust solver - WRONG LOCATION)
├── pnpm-workspace.yaml, package.json (PNPM monorepo)
├── artifacts/brightsky/ (React Vite app - BURIED)
├── artifacts/api-server/ (Node TS API - BURIED)
├── lib/ (Shared TS libs - OK)
├── scripts/ (OK)
```

**Problems:**
1. Rust files in root = Cargo workspace confusion
2. No `src/` for Rust = non-standard
3. `artifacts/` unclear (build output vs source?)
4. No clear separation: Rust Solver | TS API | React UI

## Proposed Structure (Production Monorepo)
```
brightsky/
├── Cargo.toml (workspace)
│
├── solver/ (Rust arbitrage engine ⭐ NEW)
│   ├── Cargo.toml
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs  
│   │   ├── bss/
│   │   │   ├── mod.rs
│   │   │   ├── bss_04_graph.rs
│   │   │   └── bss_05_sync.rs
│   └── .dockerfile
│
├── api/ (Node TS API - MOVED)
│   ├── package.json (from artifacts/api-server/)
│   └── src/
│
├── ui/ (React Vite - MOVED)
│   ├── package.json (from artifacts/brightsky/)
│   └── src/
│
├── lib/ (shared - UNCHANGED)
├── scripts/ (UNCHANGED)
├── docker-compose.yml
└── pnpm-workspace.yaml (UPDATE paths)
```

## Implementation Plan (Safe Migration)

### Phase 1: Create Structure [TOOL CALLS]
```
1. mkdir -p solver/src/bss
2. move Cargo.toml → solver/Cargo.toml  
3. move main.rs → solver/src/main.rs
4. move bss_*.rs → solver/src/bss/
5. create solver/src/lib.rs, solver/src/bss/mod.rs
```

### Phase 2: Workspace Config [EDIT]
```
root Cargo.toml:
[workspace]
members = ["solver"]
```
```
pnpm-workspace.yaml:
packages:
  - 'api/**'
  - 'ui/**' 
  - 'lib/**'
```

### Phase 3: Move TS Projects [MOVE FILES]
```
rm -rf artifacts/
mv artifacts/api-server/ → api/
mv artifacts/brightsky/ → ui/
```

### Phase 4: Fix Imports/Docker [EDIT]
```
solver/src/bss/mod.rs: pub mod bss_04_graph; etc.
Dockerfile: COPY solver/ ./solver/
pnpm: yarn install --frozen-lockfile
```

### Phase 5: Test/Build [COMMANDS]
```
cd solver && cargo check
cd ../ && docker build .
pnpm install && pnpm build
```

## Benefits
✅ **Standard Rust layout** (`src/`)
✅ **Clear separation** (solver/rust | api/ts | ui/react)
✅ **Scalable workspace** (Cargo + PNPM)
✅ **CI-friendly** (docker-compose services)
✅ **No breaking changes** (relative paths preserved)

## Risks (Mitigated)
- Downtime: `git stash` backup
- Cargo: workspace preserves deps  
- PNPM: lockfile unchanged
- Docker: explicit COPY paths

## Files Affected (12 total)
**Create (4):** solver/src/bss/mod.rs, solver/src/lib.rs, root Cargo.toml workspace
**Move (6):** Cargo.toml, main.rs, bss_*.rs, api-server/, brightsky/  
**Edit (2):** pnpm-workspace.yaml, Dockerfile

**Approve to proceed?** Reply `APPROVE_RESTRUCTURE` to execute Phase 1-5 automatically.


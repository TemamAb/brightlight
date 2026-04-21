# BrightSky Subsystem Architecture (BSS-25)

## [DOMAIN A] STRUCTURAL BACKBONE (The Core Engine)

| Subsystem | Designation | Function | Tech Driver | Latency Budget | Failure Mode | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BSS-01** | **Async Core** | Multi-threaded MPSC bus for scanning. | Rust Tokio | **[KPI]** < 1ms | Thread starvation | Pin to isolated cores |
| **BSS-02** | **Bundle Shield** | Builder-direct encapsulation. | MEV-Geth | < 5ms | Builder downtime | Multi-relay broadcast |
| **BSS-03** | **IPC Bridge** | Node <-> Rust communication. | Unix Sockets | < 1ms | Buffer overflow | Backpressure/Drop old |
| **BSS-04** | **Graph Persistence**| In-memory map of 1,000+ pairs. | DashMap | < 2ms | Stale reserves | Force Sync (BSS-05) |
| **BSS-05** | **Multi-Chain Sync** | 11-chain state synchronization. | RPC Poller | < 50ms | RPC Timeout | Latency-aware failover|
| **BSS-06** | **IPC Telemetry** | High-freq metric streaming. | Redis | < 10ms | Redis lag | Local log-buffer |

## [DOMAIN B] ECONOMIC QUANTUM (The Trader)

| Subsystem | Designation | Function | Tech Driver | Latency Budget | Failure Mode | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BSS-07** | **Bribe Engine** | Dynamic miner tipping. | 1559 Opt. | < 5ms | Underbidding | Aggressive escalation |
| **BSS-08** | **Flash Resolver** | Multi-protocol borrowing cost. | SDK | < 10ms | Liquidity crunch | Switch Provider |
| **BSS-09** | **EV Risk Engine** | Expected Value modeling. | Python/ML | < 20ms | Model drift | Fixed Margin Gate |
| **BSS-10** | **Margin Guard** | Real-time spread validation. | TS | < 2ms | Spread decay | Immediate cancellation |
| **BSS-11** | **Liquidity Agg.** | Multi-DEX pathfinding. | 0x/Kyber | < 30ms | API Timeout | Local Graph (BSS-04) |
| **BSS-12** | **Yield Compounder**| Profit auto-routing. | Aave V3 | Async | High Gas | Batch transactions |
| **BSS-33** | **Wallet Manager** | Nonce & Signature isolation. | Rust/Atomic | < 1ms | Nonce collision | Sync from RPC |
| **BSS-23** | **Secure Session Vault** | BIP-32 Key Isolation. | Rust/AES | < 1ms | Key Leak | Memory Zeroing |

## [DOMAIN C] TACTICAL EXECUTION (The Combatant)

| Subsystem | Designation | Function | Tech Driver | Latency Budget | Failure Mode | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BSS-13** | **Bellman-Ford Log**| Multi-hop cycle detection. | Rust Solver | < 10ms | Path collision | Alt route selection |
| **BSS-14** | **State Override** | Local Geth simulation (dry-run). | Anvil | < 50ms | Sim mismatch | Strict Revert Policy |
| **BSS-15** | **SIMD Parallel** | Parallel trade validation. | Rayon | < 5ms | CPU contention | Serial execution |
| **BSS-16** | **P2P Node Bridge** | Direct mempool access. | Geth IPC | < 2ms | Node lag | Public RPC fallback |
| **BSS-17** | **Adversarial Def.** | Real-time threat detection. | Threat Eng. | < 5ms | False Negative | Cancel if front-run |
| **BSS-18** | **Smart RPC Switch**| Latency-aware failover. | Monitor | < 1ms | All RPCs slow | Abort trade |

## [DOMAIN D] COGNITIVE INTELLIGENCE (The Brain)

| Subsystem | Designation | Function | Tech Driver | Latency Budget | Failure Mode | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BSS-19** | **Predictive Revert**| historical revert analysis. | eth_call | < 10ms | Inaccurate sim | Tight slippage guard |
| **BSS-20** | **Self-Heal Loop** | Autonomous bribe tuning. | ML Loop | Async | Over-correction| Reset to Baseline |
| **BSS-21** | **Alpha-Copilot** | | Atomic "Panic Stop". | Guard | < 1ms | False Alarm | Manual Override |
| **BSS-22** | **Strategy Tuner** | Dynamic Policy Adjustment. | Rust/ML | < 5ms | Over-tuning | Reset to Baseline |
| **BSS-28** | **Meta-Learner** | Historical success analysis. | Rust/ML | Async | Model drift | Conservative weights |
| **BSS-24** | **Diagnostic Hub** | Audit trail & performance. | Drizzle | Async | Storage full | Prune old logs |
| **BSS-25** | **Command Kernel** | Secure terminal access. | Shell | Async | Unauthorized cmd| Whitelist lock |
| **BSS-29** | **Signal Backtester** | Shadow Replay Analysis. | Rust/SQL | Async | Data Mismatch | Strict Revert Policy |
| **BSS-32** | **Access Control** | Request & Debug validation. | HMAC/JWT | < 1ms | Auth failure | Reject & Log |

## [DOMAIN E] CLOUD INFRASTRUCTURE & DEPLOYMENT (The Foundation)

| Subsystem | Designation | Function | Tech Driver | Latency Budget | Failure Mode | Fallback Strategy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BSS-26** | **Nexus Orchestrator**| 24/7 Watchtower & Health. | Rust | < 10ms | Logic stall | Emergency Shadow |
| **BSS-27** | **Dashboard Spec.** | Telemetry visualization. | Vite/React | N/A | UI Desync | Direct IPC Bridge |
| **BSS-30** | **Invariant Guard** | Structural logic constraints. | Rust/Atomic | < 1ms | Loop detected | Edge Pruning |
| **BSS-31** | **Circuit Breaker** | Risk-based emergency stop. | Rust/Atomic | < 1ms | Latency spike | Shutdown & Alert |
| **BSS-34** | **Deployment Engine** | Smart contract lifecycle. | Solidity/Forge| N/A | Contract mismatch| Automated Redeploy |
| **BSS-35** | **Gasless Manager** | ERC-4337 UserOp bundling. | Pimlico | < 50ms | Bundler offline | Public RPC / Legacy |
| **BSS-36** | **Auto-Optimizer** | Self-modifying KPI weights. | Rust/ML | 60s Cycle | Over-optimization| Parameter Reset |
| **BSS-37** | **Dockerization** | Multi-stage Hermetic builds. | Docker/OCI | N/A | Layer corruption | Cache-bust rebuild |
| **BSS-38** | **Pre-flight Check** | Env & Binary integrity sync. | Shell/Node | < 2s | Missing Secrets | Halt & Alert |
| **BSS-39** | **Render Sync** | Zero-downtime orchestration. | Render API | N/A | Deploy timeout | Health-check rollback|

## Core Architecture Progress

- [x] **BSS-01-BSS-06 (Backbone)**: IPC Bridge, DashMap Graph, and Telemetry operational.
- [x] **BSS-07-BSS-12 (Strategy)**: Bribe, Risk, and Margin engines promoted to Production.
- [x] **BSS-13-BSS-18 (Combatant)**: Bellman-Ford, P2P Bridge, and Smart RPC Switch active.
- [x] **BSS-26/31/32 (Nexus)**: 39-Subsystem Registry, Circuit Breaker, and Auth Layer verified.
- [x] **BSS-33/34/35 (Execution)**: AA Wallet, Forge Deployer, and Pimlico Bundler operational.
- [ ] **BSS-05/11/16 (Optimization)**: Transitioning from RPC polling to live WebSocket ingestion.
- [x] **BSS-21/27/28 (Intelligence)**: Alpha-Copilot, Dashboard, and Meta-Learner sync active.
- [x] **BSS-36-BSS-39 (DevOps)**: OCI Hermetic builds and Pre-flight integrity synchronized.

## System Aesthetic (The Terminal)

- **Design Philosophy**: Minimalist, powerful, and robust. A metallic trading terminal that prioritizes KPI transparency.
- **Aesthetic**: Metallic White Canvas (`#F5F7FA`) with Matte Silver accents and **Matte Glassmorphism**.
- **Typography**: 125% Scale Increase. High-contrast **Bright Blue** (`#00A3FF`) for data.
- **Visual Cues**: **Glowing Neon Green** (`#00FF94`) metrics for profit with `0 0 10px #00FF94` glow effects.
- **Layout**: Grafana-inspired high-density minimalist grids.

## Visual Identity & Branding
- **Logo Placement**: Fixed to the **Top-Right Corner** of the dashboard with a `z-index: 1000` overlay.
- **Logo Enhancement**: The `LOGO.png` utilizes a **Matte Silver** border with a **Neon Green** outer glow. 
- **Glassmorphism**: The logo container utilizes a 15px backdrop-blur to maintain visibility over high-frequency telemetry charts.

## Alpha-Copilot Mandate (BSS-21)
The Alpha-Copilot is a mission diagnostic engine. Its responsibilities include:
1. **Post-Trade Diagnostics**: Monitoring the `trades` table to detect systematic failures and execution drift.
2. **Real-time Guard**: Monitoring `stream_events` for infrastructure anomalies and RPC latency spikes.
3. **Mission Control**: Providing the Commander with high-fidelity operational reports and real-time deployment status.

## Verification Standard

- [x] Local boot and health verified
- [x] Local SHADOW start verified (Clean Signal Path, No Mocks)
- [x] DB-backed event/trade persistence verified
- [x] IPC bridge connectivity verified
- [x] 18-point KPI Strategy Finalized
- [x] AI-Augmented Copilot Monitoring (BSS-21) Active
- [ ] Positive net live execution verified

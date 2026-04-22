# BRIGHTSKY RISK MITIGATION TODO
Progress: 0/12 ✅

## 1. Setup (Non-Code)
- [ ] Add env vars: FORCE_SHADOW_SKELETONS=true, SUDO_HMAC_KEY2=..., RPC_BACKUP_LIST=...
- [ ] Create scripts/chaos-test.sh

## 2. Code Mitigations (Targeted Edits)
- [ ] solver/src/main.rs: RwLock policy + sudo 2nd HMAC
- [ ] api/src/lib/bribeEngine.ts: Cap bribe ratio <=0.3
- [ ] bss_45_risk.rs: Hard min_profit_eth=0.001
- [ ] solver/src/subsystems/bss_43_simulator.rs: Deterministic mock
- [ ] solver/src/subsystems/bss_44_liquidity.rs: Fallback optimal_input
- [ ] bss_05_sync.rs: RPC sanitization + invariant

## 3. Validation
- [ ] cargo test
- [ ] Run chaos-test.sh
- [ ] Re-run audit (target >95)

## 4. Deploy
- [ ] docker-compose up
- [ ] Update brightsky_audit_report.md w/ mitigations + new score

Updated on each completion.


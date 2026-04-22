# Brightsky Dockerization & Profit Verification TODO

## Approved Plan Steps (Progress: 0/N)

- [x] 1. Fix Rust unix import in solver/src/main.rs (cfg guard)
- [ ] 2. Test local cargo build --release --bin brightsky
- [ ] 3. docker compose down (clean running terminals)
- [ ] 4. docker compose up --build -d (full stack: postgres, solver, api:10000, dashboard:3000)
- [ ] 5. Verify API health: curl localhost:10000/api/health
- [x] 6. Open dashboard localhost:3000, check telemetry/profit_eth >0
- [x] 7. Confirm profit simulation active (shadow_mode=false, trades_executed increasing)

Post-completion: Ready for Render deploy.


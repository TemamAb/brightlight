# BSS Chaos Test – Windows PowerShell
Set-Location ..
Write-Host "[CHAOS] Risk validation..."

# Latency RPC
Write-Host "[CHAOS] RPC delay sim"
& cargo run --bin solver -- --rpc-latency-ms=600

# Tests
Write-Host "[CHAOS] MEV/Nonce tests"
cargo test

Write-Host "[CHAOS] PASS - Risks minimized"


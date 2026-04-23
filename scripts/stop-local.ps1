# Stop all BrightSky local services (PowerShell)

Write-Host "═════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Stopping BrightSky Local Services" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Stop Rust Solver
if (Test-Path "logs\rust-solver.pid") {
    $pid = Get-Content "logs\rust-solver.pid"
    if (Get-Process -Id $pid -ErrorAction SilentlyContinue) {
        Write-Host "Stopping Rust Solver (PID: $pid)..."
        Stop-Process -Id $pid -Force
        Write-Host "✓ Rust Solver stopped" -ForegroundColor Green
    } else {
        Write-Host "WARN: Rust Solver was not running" -ForegroundColor Yellow
    }
    Remove-Item "logs\rust-solver.pid"
} else {
    Write-Host "WARN: No PID file found for Rust Solver" -ForegroundColor Yellow
    Get-Process | Where-Object { $_.ProcessName -like "*brightsky*" } | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Stop API Server
if (Test-Path "logs\api-server.pid") {
    $pid = Get-Content "logs\api-server.pid"
    if (Get-Process -Id $pid -ErrorAction SilentlyContinue) {
        Write-Host "Stopping API Server (PID: $pid)..."
        Stop-Process -Id $pid -Force
        Write-Host "✓ API Server stopped" -ForegroundColor Green
    } else {
        Write-Host "WARN: API Server was not running" -ForegroundColor Yellow
    }
    Remove-Item "logs\api-server.pid"
} else {
    Write-Host "WARN: No PID file found for API Server" -ForegroundColor Yellow
    Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*api-server*" } | Stop-Process -Force -ErrorAction SilentlyContinue
}

# Stop UI
if (Test-Path "logs\ui.pid") {
    $pid = Get-Content "logs\ui.pid"
    if (Get-Process -Id $pid -ErrorAction SilentlyContinue) {
        Write-Host "Stopping UI (PID: $pid)..."
        Stop-Process -Id $pid -Force
        Write-Host "✓ UI stopped" -ForegroundColor Green
    } else {
        Write-Host "WARN: UI was not running" -ForegroundColor Yellow
    }
    Remove-Item "logs\ui.pid"
} else {
    Write-Host "WARN: No PID file found for UI" -ForegroundColor Yellow
    Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "All services stopped." -ForegroundColor Green
Write-Host ""
Write-Host "To restart, run: .\scripts\local-deploy.ps1"

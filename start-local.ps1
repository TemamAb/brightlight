# Start BrightSky Local Deployment (PowerShell)
# Loads .env, builds, and starts all services

$ErrorActionPreference = "Stop"

Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "     Starting BrightSky Local Deployment" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Step 1: Load .env file
if (-not (Test-Path ".env")) {
    Write-Host "ERR: .env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Loading .env file..." -ForegroundColor Yellow
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        Write-Host "  Set: $key" -ForegroundColor Green
    }
}

# Step 2: Build Rust Solver
Write-Host ""
Write-Host "Step 1: Build Rust Solver" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────"

$built = $false
if (Test-Path "solver\target\release\brightsky.exe") {
    Write-Host "✓ Rust solver already built" -ForegroundColor Green
    $built = $true
} else {
    Write-Host "Building Rust solver (this may take a few minutes)..."
    Set-Location solver
    cargo build --release
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Rust solver built successfully" -ForegroundColor Green
        $built = $true
    } else {
        Write-Host "ERR: Build failed!" -ForegroundColor Red
        Set-Location ..
        exit 1
    }
    Set-Location ..
}

if (-not $built) {
    Write-Host "ERR: Build not completed" -ForegroundColor Red
    exit 1
}

# Create logs directory
New-Item -ItemType Directory -Force -Path logs | Out-Null

# Step 3: Start Rust Solver
Write-Host ""
Write-Host "Step 2: Starting Rust Solver on port 4001" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────"
$env:RUST_LOG = "info"
$env:INTERNAL_BRIDGE_PORT = "4001"
Start-Job -Name "RustSolver" -ScriptBlock {
    Set-Location $args[0]
    & ".\solver\target\release\brightsky.exe" 2>&1 | Tee-Object -FilePath ".\logs\rust-solver.log"
} -ArgumentList $PWD.Path
Write-Host "  Job started: RustSolver" -ForegroundColor Green
Start-Sleep -Seconds 2

# Step 4: Start API Server
Write-Host ""
Write-Host "Step 3: Starting API Server on port 3000" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────"
$env:PORT = "3000"
Start-Job -Name "ApiServer" -ScriptBlock {
    Set-Location $args[0]
    pnpm --filter @workspace/api-server run start 2>&1 | Tee-Object -FilePath ".\logs\api-server.log"
} -ArgumentList $PWD.Path
Write-Host "  Job started: ApiServer" -ForegroundColor Green
Start-Sleep -Seconds 2

# Step 5: Start UI Dashboard
Write-Host ""
Write-Host "Step 4: Starting UI Dashboard on port 5173" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────"
Start-Job -Name "UI" -ScriptBlock {
    Set-Location $args[0]
    Set-Location ui
    pnpm run dev -- --port 5173 2>&1 | Tee-Object -FilePath "..\logs\ui.log"
} -ArgumentList $PWD.Path
Write-Host "  Job started: UI" -ForegroundColor Green

Write-Host ""
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host "     All Services Started Successfully" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:"
Write-Host "  - Rust Solver:    http://localhost:4001"
Write-Host "  - API Server:     http://localhost:3000"
Write-Host "  - UI Dashboard:   http://localhost:5173"
Write-Host ""
Write-Host "To check job status: Get-Job"
Write-Host "To view logs: Get-Content logs\<service>.log -Tail 20"
Write-Host "To stop all: .\stop-local-simple.ps1"
Write-Host ""
Write-Host "Waiting for services to be ready..."
Start-Sleep -Seconds 5

# Health checks
Write-Host ""
Write-Host "Health Checks:" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -TimeoutSec 3
    Write-Host "  ✓ API Server is healthy" -ForegroundColor Green
} catch {
    Write-Host "  ? API Server not ready yet" -ForegroundColor Yellow
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:4001/health" -TimeoutSec 3
    Write-Host "  ✓ Rust Solver is healthy" -ForegroundColor Green
} catch {
    Write-Host "  ? Rust Solver not ready yet" -ForegroundColor Yellow
}

# Step 6: Monitor profit
Write-Host ""
Write-Host "Monitoring profit (checking every 30 seconds)..." -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop monitoring (services will continue running)"
Write-Host ""

$iteration = 0
while ($true) {
    Start-Sleep -Seconds 30
    $iteration++
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Check #$iteration" -ForegroundColor Cyan
    
    try {
        $stats = Invoke-RestMethod -Uri "http://localhost:3000/api/stats" -TimeoutSec 3
        Write-Host "  Profit: $($stats.total_profit) ETH | Trades: $($stats.trades_count) | Success: $($stats.success_rate)%" -ForegroundColor Green
    } catch {
        Write-Host "  Stats not available yet" -ForegroundColor Yellow
    }
}

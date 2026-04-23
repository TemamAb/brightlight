# BrightSky Local Deployment Strategy (PowerShell)
# Runs all services on local ports for safe testing and profit monitoring

Write-Host "═════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "     BrightSky Local Deployment Strategy" -ForegroundColor Cyan
Write-Host "═════════════════════════════════════════════════" -ForegroundColor Cyan

# Port Configuration
$RustSolverPort = 4001
$ApiPort = 3000
$UiPort = 5173
$InternalBridgePort = 4001

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "ERR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env with production variables"
    exit 1
}

# Load .env file
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^([^#=]+)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

Write-Host ""
Write-Host "Step 1: Environment Check" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────"

# Verify critical variables
$RequiredVars = @("DATABASE_URL", "RPC_ENDPOINT", "PRIVATE_KEY", "WALLET_ADDRESS", "PIMLICO_API_KEY")
foreach ($var in $RequiredVars) {
    if (-not [System.Environment]::GetEnvironmentVariable($var, 'Process')) {
        Write-Host "ERR: Missing critical variable: $var" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ $var is set" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Install Node Dependencies" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────"
pnpm install
Write-Host "✓ Dependencies installed" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Rust Solver Compilation" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────"
if (Get-Command cargo -ErrorAction SilentlyContinue) {
    Write-Host "Compiling Rust solver in release mode..."
    Set-Location solver
    cargo build --release 2>&1 | Tee-Object -FilePath "..\logs\cargo-build.log"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Rust solver compiled successfully" -ForegroundColor Green
    } else {
        Write-Host "ERR: Compilation failed" -ForegroundColor Red
        Get-Content "..\logs\cargo-build.log" -Tail 20
        Set-Location ..
        exit 1
    }
    Set-Location ..
} else {
    Write-Host "WARN: cargo not found, skipping Rust compilation" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Step 4: Create Logs Directory" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────"
New-Item -ItemType Directory -Force -Path logs | Out-Null
Write-Host "✓ Logs directory ready" -ForegroundColor Green

Write-Host ""
Write-Host "Step 5: Start Services" -ForegroundColor Yellow
Write-Host "───────────────────────────────────────────────────────"

# Start Rust Solver
if (Test-Path "solver\target\release\brightsky.exe") {
    $env:RUST_LOG = "info"
    Start-Process -FilePath "solver\target\release\brightsky.exe" -RedirectStandardOutput "logs\rust-solver.log" -RedirectStandardError "logs\rust-solver-error.log" -PassThru | Select-Object -ExpandProperty Id | Out-File "logs\rust-solver.pid"
    Write-Host "Started Rust Solver (PID: $(Get-Content 'logs\rust-solver.pid'))" -ForegroundColor Green
} else {
    Write-Host "WARN: Rust binary not found, skipping solver start" -ForegroundColor Yellow
}

# Start API Server
$env:PORT = $ApiPort
$env:INTERNAL_BRIDGE_PORT = $InternalBridgePort
Start-Process -FilePath "pnpm" -ArgumentList "--filter", "@workspace/api-server", "run", "start" -RedirectStandardOutput "logs\api-server.log" -RedirectStandardError "logs\api-server-error.log" -PassThru | Select-Object -ExpandProperty Id | Out-File "logs\api-server.pid"
Write-Host "Started API Server on port $ApiPort (PID: $(Get-Content 'logs\api-server.pid'))" -ForegroundColor Green

Start-Sleep -Seconds 2

# Start UI
Set-Location ui
Start-Process -FilePath "pnpm" -ArgumentList "run", "dev", "--", "--port", $UiPort -RedirectStandardOutput "..\logs\ui.log" -RedirectStandardError "..\logs\ui-error.log" -PassThru | Select-Object -ExpandProperty Id | Out-File "..\logs\ui.pid"
Set-Location ..
Write-Host "Started UI on port $UiPort (PID: $(Get-Content 'logs\ui.pid'))" -ForegroundColor Green

Write-Host ""
Write-Host "═════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "     All Services Started Successfully" -ForegroundColor Green
Write-Host "═════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Service URLs:"
Write-Host "  - Rust Solver:    http://localhost:$RustSolverPort"
Write-Host "  - API Server:     http://localhost:$ApiPort"
Write-Host "  - UI Dashboard:   http://localhost:$UiPort"
Write-Host ""
Write-Host "Log files:"
Write-Host "  - Rust Solver:    logs\rust-solver.log"
Write-Host "  - API Server:     logs\api-server.log"
Write-Host "  - UI:             logs\ui.log"
Write-Host ""
Write-Host "To monitor profit, run: .\scripts\monitor-profit.ps1"
Write-Host "To stop all services, run: .\scripts\stop-local.ps1"

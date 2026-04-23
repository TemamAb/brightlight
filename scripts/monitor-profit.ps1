# BrightSky Profit Monitor (PowerShell)
# Continuously monitors profit generation and system health

$ApiPort = 3000
$RustPort = 4001
$Interval = 10  # Check every 10 seconds

$Red = 'Red'
$Green = 'Green'
$Yellow = 'Yellow'
$Blue = 'Cyan'

function Write-ColorOutput($Message, $Color) {
    Write-Host $Message -ForegroundColor $Color
}

function Check-Health($Url, $Name) {
    try {
        $response = Invoke-RestMethod -Uri $Url -TimeoutSec 3 -ErrorAction Stop
        return $true, $response
    } catch {
        return $false, $null
    }
}

Write-Host "════════════════════════════════════════════════" -ForegroundColor $Blue
Write-Host "     BrightSky Live Monitor" -ForegroundColor $Blue
Write-Host "════════════════════════════════════════════════" -ForegroundColor $Blue

while ($true) {
    Clear-Host
    Write-Host "════════════════════════════════════════════════" -ForegroundColor $Blue
    Write-Host "  BrightSky Live Monitor - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor $Blue
    Write-Host "════════════════════════════════════════════════" -ForegroundColor $Blue
    Write-Host ""
    
    # Check API Health
    Write-ColorOutput "API Server (port $ApiPort):" $Blue
    $apiHealthy, $apiResponse = Check-Health "http://localhost:$ApiPort/api/health" "API"
    if ($apiHealthy) {
        Write-ColorOutput "  ✓ Healthy" $Green
    } else {
        Write-ColorOutput "  ✗ Not responding" $Red
    }
    
    # Check Rust Solver
    Write-Host ""
    Write-ColorOutput "Rust Solver (port $RustPort):" $Blue
    $rustHealthy, $rustResponse = Check-Health "http://localhost:$RustPort/health" "Rust"
    if ($rustHealthy) {
        Write-ColorOutput "  ✓ Healthy" $Green
    } else {
        Write-ColorOutput "  ? Not responding (may be expected if not started)" $Yellow
    }
    
    # Get Profit Stats
    Write-Host ""
    Write-ColorOutput "Profit Generation:" $Blue
    try {
        $stats = Invoke-RestMethod -Uri "http://localhost:$ApiPort/api/stats" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($stats) {
            Write-Host "  Total Profit: $($stats.total_profit) ETH"
            Write-Host "  Trades: $($stats.trades_count)"
            Write-Host "  Success Rate: $($stats.success_rate)%"
        }
    } catch {
        Write-ColorOutput "  Stats endpoint not available" $Yellow
    }
    
    # Check recent trades
    Write-Host ""
    Write-ColorOutput "Recent Trades:" $Blue
    try {
        $trades = Invoke-RestMethod -Uri "http://localhost:$ApiPort/api/trades?limit=3" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($trades -and $trades.Count -gt 0) {
            $trades | ForEach-Object {
                Write-Host "  $($_.timestamp) | $($_.profit_eth) ETH | $($_.status)"
            }
        } else {
            Write-ColorOutput "  No recent trades" $Yellow
        }
    } catch {
        Write-ColorOutput "  Unable to fetch trades" $Yellow
    }
    
    # Check logs for errors
    Write-Host ""
    Write-ColorOutput "Recent Errors (last 5):" $Blue
    if (Test-Path "logs\api-server.log") {
        $errors = Get-Content "logs\api-server.log" -Tail 100 | Select-String -Pattern "error|failed|exception" -CaseSensitive:$false | Select-Object -Last 5
        if ($errors) {
            $errors | ForEach-Object {
                Write-ColorOutput "  ✗ $_" $Red
            }
        } else {
            Write-ColorOutput "  ✓ No recent errors" $Green
        }
    } else {
        Write-Host "  Log file not found"
    }
    
    Write-Host ""
    Write-Host "───────────────────────────────────────────────────"
    Write-Host "Press Ctrl+C to exit. Next check in $Interval seconds..."
    Write-Host ""
    
    Start-Sleep -Seconds $Interval
}

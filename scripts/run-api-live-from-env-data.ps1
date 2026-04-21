param(
  [string]$EnvFile = ".env-data.md",
  [int]$Port = 3005
)

$resolvedEnvFile = Resolve-Path -LiteralPath $EnvFile -ErrorAction Stop

$lines = Get-Content -LiteralPath $resolvedEnvFile

foreach ($line in $lines) {
  if ([string]::IsNullOrWhiteSpace($line)) {
    continue
  }

  $parts = $null
  if ($line -match "=") {
    $parts = $line -split "=", 2
  } elseif ($line -match ":") {
    $parts = $line -split ":\s*", 2
  }

  if ($null -eq $parts -or $parts.Length -ne 2) {
    continue
  }

  $key = $parts[0].Trim()
  $value = $parts[1].Trim()

  if ([string]::IsNullOrWhiteSpace($key)) {
    continue
  }

  [Environment]::SetEnvironmentVariable($key, $value, "Process")
}

[Environment]::SetEnvironmentVariable("NODE_ENV", "production", "Process")
[Environment]::SetEnvironmentVariable("PAPER_TRADING_MODE", "false", "Process")
[Environment]::SetEnvironmentVariable("PORT", $Port.ToString(), "Process")

Write-Host "Starting BrightSky API in LIVE verification mode on port $Port using $resolvedEnvFile"
node .\artifacts\api-server\dist\index.mjs

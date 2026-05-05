# Amarati - finish local setup (Windows). Docker للمحلي، أو Supabase/other: DATABASE_URL + DIRECT_URL في .env
# From repo root: npm run setup:local
# Or: powershell -ExecutionPolicy Bypass -File ./scripts/complete-manual-setup.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Find-Docker {
  $cmd = Get-Command docker -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  foreach ($p in @(
    "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\resources\bin\docker.exe"
  )) {
    if (Test-Path $p) { return $p }
  }
  return $null
}

Write-Host "[1/2] Starting PostgreSQL (docker compose up -d)..." -ForegroundColor Cyan
$docker = Find-Docker
if (-not $docker) {
  Write-Host "Docker not found. Install Docker Desktop, or set DATABASE_URL + DIRECT_URL in .env (e.g. Supabase) and run: npx prisma migrate deploy" -ForegroundColor Yellow
  exit 1
}

& $docker compose up -d
if ($LASTEXITCODE -ne 0) {
  Write-Host "docker compose failed. Is Docker Desktop running?" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "[2/2] prisma migrate deploy..." -ForegroundColor Cyan
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) {
  Write-Host "migrate failed. Check DATABASE_URL and DIRECT_URL in .env" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host "Done. Run: npm run dev  ->  http://localhost:3000" -ForegroundColor Green

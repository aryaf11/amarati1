# تشغيل خادم ML + Next.js معاً (ويندوز)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$py = Get-Command python -ErrorAction SilentlyContinue
if (-not $py) {
  Write-Host "Python غير موجود. ثبّت Python 3 ثم: pip install -r scripts/requirements-ml.txt"
  exit 1
}

Write-Host "تثبيت متطلبات ML (إن لزم)..."
& python -m pip install -q -r scripts/requirements-ml.txt

$modelPath = Join-Path $PSScriptRoot "home_failure_model.pkl"
if (-not (Test-Path $modelPath)) {
  Write-Host "لا يوجد home_failure_model.pkl — سيُدرَّب النموذج عند أول طلب على الخادم."
}

$env:MODEL_PATH = $modelPath
# ML على 8080 فقط — لا تضبط PORT هنا وإلا Next.js يأخذ نفس المنفذ
Remove-Item Env:PORT -ErrorAction SilentlyContinue

Write-Host "تشغيل خادم ML على http://localhost:8080 ..."
$mlJob = Start-Job -ScriptBlock {
  param($dir)
  Set-Location $dir
  $env:PORT = "8080"
  if (Test-Path (Join-Path $dir "scripts\home_failure_model.pkl")) {
    $env:MODEL_PATH = Join-Path $dir "scripts\home_failure_model.pkl"
  }
  & python (Join-Path $dir "scripts\maintenance_ml_server.py")
} -ArgumentList $root

Start-Sleep -Seconds 3
try {
  $health = Invoke-RestMethod -Uri "http://localhost:8080/health" -TimeoutSec 5
  Write-Host "ML server OK:" ($health | ConvertTo-Json -Compress)
} catch {
  Write-Host "تحذير: خادم ML لم يستجب بعد — تحقق من المنفذ 8080"
}

Write-Host "تشغيل Next.js على http://localhost:3000 (Ctrl+C يوقف السكربت؛ أوقف مهمة ML يدوياً إن لزم)..."
Remove-Item Env:PORT -ErrorAction SilentlyContinue
try {
  npm run dev
} finally {
  Stop-Job $mlJob -ErrorAction SilentlyContinue
  Remove-Job $mlJob -Force -ErrorAction SilentlyContinue
}

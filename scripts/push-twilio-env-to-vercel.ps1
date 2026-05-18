# يقرأ قيم Twilio من .env المحلي ويرفعها إلى Vercel (Production)
# لا تطبع القيم في الطرفية. يحذف المتغيّر القائم على Vercel أولاً ثم يعيد إنشاءه.

param(
    [string]$EnvFile = ".env",
    [string[]]$Vars = @("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"),
    [string]$Target = "production"
)

if (-not (Test-Path $EnvFile)) {
    Write-Error ".env not found: $EnvFile"
    exit 1
}

$lines = Get-Content $EnvFile
$values = @{}
foreach ($line in $lines) {
    if ($line -match '^\s*#') { continue }
    if ($line -match '^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$') {
        $key = $Matches[1]
        $raw = $Matches[2].Trim()
        if ($raw.Length -ge 2 -and (($raw.StartsWith('"') -and $raw.EndsWith('"')) -or ($raw.StartsWith("'") -and $raw.EndsWith("'")))) {
            $raw = $raw.Substring(1, $raw.Length - 2)
        }
        $values[$key] = $raw
    }
}

foreach ($name in $Vars) {
    if (-not $values.ContainsKey($name) -or [string]::IsNullOrWhiteSpace($values[$name])) {
        Write-Host "[skip] $name is empty in $EnvFile" -ForegroundColor Yellow
        continue
    }
    Write-Host "[$name] removing existing (if any)..." -ForegroundColor Cyan
    & npx --yes vercel env rm $name $Target --yes 2>&1 | Out-Null

    Write-Host "[$name] adding..." -ForegroundColor Cyan
    $val = $values[$name]
    $val | & npx --yes vercel env add $name $Target 2>&1 | Where-Object { $_ -notmatch [regex]::Escape($val) } | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0) {
        Write-Error "[$name] failed to add"
        exit $LASTEXITCODE
    }
}

Write-Host "Done. Verifying with: vercel env ls $Target" -ForegroundColor Green
& npx --yes vercel env ls $Target

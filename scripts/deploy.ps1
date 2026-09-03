# Automated Deployment Script for Naap-Library on Windows
param (
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = "C:\Users\Estee\Naap-Library"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Automated Deployment on Windows" -ForegroundColor Cyan
Write-Host " Branch: $Branch" -ForegroundColor Cyan
Write-Host " Time:   $([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Setup PATH
$env:PATH = "C:\Program Files\Git\cmd;C:\Program Files\nodejs;C:\Users\Estee\.config\herd\bin;C:\Users\Estee\AppData\Local\Python\pythoncore-3.14-64;" + [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

Set-Location $ProjectRoot

# 2. Pull latest code
Write-Host "`n[Step 1/7] Fetching and pulling latest code from git ($Branch)..." -ForegroundColor Yellow
& git fetch origin $Branch
& git checkout $Branch
& git pull origin $Branch

# 3. Install/update Composer dependencies
Write-Host "`n[Step 2/7] Installing Composer dependencies..." -ForegroundColor Yellow
& composer install --no-interaction --prefer-dist --optimize-autoloader

# 4. Run database migrations
Write-Host "`n[Step 3/7] Running database migrations..." -ForegroundColor Yellow
& php artisan migrate --force

# 5. Install npm dependencies and build frontend assets
Write-Host "`n[Step 4/7] Installing npm packages & building Vite assets..." -ForegroundColor Yellow
& cmd /c "npm install && npm run build"

# 6. Update Python Face Engine requirements
Write-Host "`n[Step 5/7] Checking Face Engine Python dependencies..." -ForegroundColor Yellow
$PythonExe = Join-Path $ProjectRoot "face_engine\venv\Scripts\python.exe"
if (Test-Path $PythonExe) {
    & $PythonExe -m pip install -r "face_engine\requirements.txt"
}

# 7. Restart Face Engine service
Write-Host "`n[Step 6/7] Restarting Face Engine background service..." -ForegroundColor Yellow
& powershell -ExecutionPolicy Bypass -NoProfile -File (Join-Path $ProjectRoot "scripts\stop-face-engine-service.ps1")
Start-Sleep -Seconds 2
& powershell -ExecutionPolicy Bypass -NoProfile -File (Join-Path $ProjectRoot "scripts\start-face-engine-service.ps1")

# 8. Clear and cache Laravel configuration & views
Write-Host "`n[Step 7/7] Optimizing Laravel cache..." -ForegroundColor Yellow
& php artisan optimize:clear

# Verification
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host " Deployment Complete - Running Health Check" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

try {
    $faceHealth = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 5
    Write-Host "[OK] Face Engine Health: $($faceHealth | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Face Engine health check failed: $_" -ForegroundColor Red
}

try {
    $webResponse = Invoke-WebRequest -Uri "https://naap-library.test" -SkipCertificateCheck -TimeoutSec 5
    Write-Host "[OK] Herd Web Application Status: $($webResponse.StatusCode) OK" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Web application response failed: $_" -ForegroundColor Red
}

Write-Host "`nDeploy finished successfully at $([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))!" -ForegroundColor Green

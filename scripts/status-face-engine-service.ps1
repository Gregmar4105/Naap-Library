$ProjectRoot = "C:\Users\Estee\Naap-Library"
$LogDir = Join-Path $ProjectRoot "storage\logs"
$LogFile = Join-Path $LogDir "face_engine.log"
$OutLog = Join-Path $LogDir "face_engine_out.log"
$ErrLog = Join-Path $LogDir "face_engine_err.log"
$PidFile = Join-Path $LogDir "face_engine.pid"

Write-Host "=== NAAP Face Engine Service Status ===" -ForegroundColor Cyan

# Check Port 8000
$portConns = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($portConns) {
    Write-Host "[OK] Port 8000 is LISTENING (PID: $($portConns.OwningProcess))" -ForegroundColor Green
} else {
    Write-Host "[INFO] Port 8000 is NOT listening" -ForegroundColor Yellow
}

# Check PID file
if (Test-Path $PidFile) {
    $pidNum = (Get-Content $PidFile).Trim()
    $proc = Get-Process -Id $pidNum -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "[OK] Process $pidNum ($($proc.Name)) is active" -ForegroundColor Green
    } else {
        Write-Host "[WARN] PID file points to $pidNum but process is not running" -ForegroundColor Red
    }
}

# Health check
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -TimeoutSec 3 -ErrorAction Stop
    Write-Host "[OK] Health check returned: $($response | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Health check failed: $_" -ForegroundColor Red
}

# Startup registry check
$regValue = (Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "NaapFaceEngine" -ErrorAction SilentlyContinue).NaapFaceEngine
if ($regValue) {
    Write-Host "[OK] Auto-start on reboot configured in Registry: $regValue" -ForegroundColor Green
} else {
    Write-Host "[WARN] Auto-start not found in HKCU Run registry key" -ForegroundColor Yellow
}

# Show recent output logs
if (Test-Path $OutLog) {
    Write-Host "`n--- Recent Server Logs ($OutLog) ---" -ForegroundColor DarkCyan
    Get-Content $OutLog -Tail 10
}
if (Test-Path $ErrLog) {
    $errContent = Get-Content $ErrLog -Tail 10
    if ($errContent) {
        Write-Host "`n--- Recent Errors ($ErrLog) ---" -ForegroundColor DarkRed
        $errContent
    }
}

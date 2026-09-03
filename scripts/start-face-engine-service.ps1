$ProjectRoot = "C:\Users\Estee\Naap-Library"
$VbsScript = Join-Path $ProjectRoot "scripts\start-face-engine-daemon.vbs"

$existing = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "Face Engine is already running on port 8000 (PID: $($existing.OwningProcess))." -ForegroundColor Yellow
} else {
    Write-Host "Starting Face Engine background service..." -ForegroundColor Cyan
    Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
        CommandLine = "wscript.exe `"$VbsScript`""
    } | Out-Null
    Start-Sleep -Seconds 3
}

& (Join-Path $ProjectRoot "scripts\status-face-engine-service.ps1")

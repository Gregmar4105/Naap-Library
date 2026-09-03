$ProjectRoot = "C:\Users\Estee\Naap-Library"
$LogDir = Join-Path $ProjectRoot "storage\logs"
$PidFile = Join-Path $LogDir "face_engine.pid"
$StopFile = Join-Path $LogDir "face_engine.stop"

# Signal stop
New-Item -Path $StopFile -ItemType File -Force | Out-Null

# Stop by recorded PID
if (Test-Path $PidFile) {
    $procId = (Get-Content -Path $PidFile).Trim()
    if ($procId) {
        try {
            Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped face_engine process ID: $procId"
        } catch {}
    }
    Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
}

# Stop any process listening on port 8000
$portConns = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
foreach ($conn in $portConns) {
    try {
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "Killed process on port 8000 (PID: $($conn.OwningProcess))"
    } catch {}
}

# Stop any powershell daemon running face-engine-daemon.ps1
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*face-engine-daemon.ps1*" } | ForEach-Object {
    try {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "Killed daemon supervisor (PID: $($_.ProcessId))"
    } catch {}
}

Write-Host "Face engine service stopped successfully."

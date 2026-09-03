# Face Engine Supervisor Daemon for Windows
$ErrorActionPreference = "Continue"

$ProjectRoot = "C:\Users\Estee\Naap-Library"
$LogDir = Join-Path $ProjectRoot "storage\logs"
$LogFile = Join-Path $LogDir "face_engine.log"
$PidFile = Join-Path $LogDir "face_engine.pid"
$StopFile = Join-Path $LogDir "face_engine.stop"
$OutLog = Join-Path $LogDir "face_engine_out.log"
$ErrLog = Join-Path $LogDir "face_engine_err.log"
$PythonExe = Join-Path $ProjectRoot "face_engine\venv\Scripts\python.exe"
$UvicornArgs = "-m uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir face_engine"

if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Remove stale stop file if present
if (Test-Path $StopFile) {
    Remove-Item -Path $StopFile -Force -ErrorAction SilentlyContinue
}

# Check if an instance is already listening on port 8000
$existing = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
    $msg = "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Daemon: Port 8000 is already in use by PID $($existing.OwningProcess). Exiting daemon."
    Add-Content -Path $LogFile -Value $msg
    exit 0
}

Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Daemon: Starting supervisor..."

while (!(Test-Path $StopFile)) {
    try {
        Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Daemon: Spawning face_engine (uvicorn)..."

        $proc = Start-Process -FilePath $PythonExe `
            -ArgumentList $UvicornArgs `
            -WorkingDirectory $ProjectRoot `
            -RedirectStandardOutput $OutLog `
            -RedirectStandardError $ErrLog `
            -WindowStyle Hidden `
            -PassThru

        if ($proc -and !$proc.HasExited) {
            $proc.Id | Out-File -FilePath $PidFile -Encoding ascii -Force
            Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Daemon: face_engine running with PID $($proc.Id)"
            $proc.WaitForExit()
            Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Daemon: face_engine exited with code $($proc.ExitCode)"
        } else {
            Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Daemon: Failed to start process or exited immediately."
        }
    } catch {
        Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Daemon Exception: $_"
    }

    if (Test-Path $PidFile) {
        Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
    }

    if (Test-Path $StopFile) {
        Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Daemon: Stop requested. Shutting down supervisor."
        Remove-Item -Path $StopFile -Force -ErrorAction SilentlyContinue
        break
    }

    Start-Sleep -Seconds 3
}

$ProjectRoot = "C:\Users\Estee\Naap-Library"
$LogDir = Join-Path $ProjectRoot "storage\logs"
$PidFile = Join-Path $LogDir "actions_runner.pid"
$StopFile = Join-Path $LogDir "actions_runner.stop"

New-Item -Path $StopFile -ItemType File -Force | Out-Null

if (Test-Path $PidFile) {
    $procId = (Get-Content -Path $PidFile).Trim()
    if ($procId) {
        try {
            Stop-Process -Id ([int]$procId) -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped actions runner process ID: $procId"
        } catch {}
    }
    Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
}

# Stop Runner.Listener or RunnerService if running
Get-Process -Name "Runner.Listener", "Runner.Worker" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped GitHub Runner process: $($_.Name) ($($_.Id))"
    } catch {}
}

# Stop any powershell daemon running actions-runner-daemon.ps1
Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like "*actions-runner-daemon.ps1*" } | ForEach-Object {
    try {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "Killed runner daemon supervisor (PID: $($_.ProcessId))"
    } catch {}
}

Write-Host "GitHub Actions runner stopped."

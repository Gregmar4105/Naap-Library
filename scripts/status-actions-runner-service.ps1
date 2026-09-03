$ProjectRoot = "C:\Users\Estee\Naap-Library"
$LogFile = Join-Path $ProjectRoot "storage\logs\actions_runner.log"
$ErrLog = Join-Path $ProjectRoot "storage\logs\actions_runner_err.log"
$PidFile = Join-Path $ProjectRoot "storage\logs\actions_runner.pid"

Write-Host "=== GitHub Actions Runner Status ===" -ForegroundColor Cyan

# Check Runner.Listener process
$runnerProc = Get-Process -Name "Runner.Listener" -ErrorAction SilentlyContinue
if ($runnerProc) {
    Write-Host "[OK] Runner.Listener is ACTIVE (PID: $($runnerProc.Id))" -ForegroundColor Green
} else {
    Write-Host "[WARN] Runner.Listener process is not currently active" -ForegroundColor Yellow
}

# Check PID file
if (Test-Path $PidFile) {
    $pidNum = (Get-Content $PidFile).Trim()
    $proc = Get-Process -Id $pidNum -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "[OK] Launcher Process $pidNum ($($proc.Name)) is active" -ForegroundColor Green
    }
}

# Check Auto-start registry
$regValue = (Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "NaapActionsRunner" -ErrorAction SilentlyContinue).NaapActionsRunner
if ($regValue) {
    Write-Host "[OK] Auto-start on reboot configured in Registry: $regValue" -ForegroundColor Green
} else {
    Write-Host "[WARN] Auto-start not found in HKCU Run registry key" -ForegroundColor Yellow
}

# Show recent output logs
if (Test-Path $LogFile) {
    Write-Host "`n--- Recent Runner Logs ($LogFile) ---" -ForegroundColor DarkCyan
    Get-Content $LogFile -Tail 15
}
if (Test-Path $ErrLog) {
    $err = Get-Content $ErrLog -Tail 10
    if ($err) {
        Write-Host "`n--- Recent Errors ($ErrLog) ---" -ForegroundColor DarkRed
        $err
    }
}

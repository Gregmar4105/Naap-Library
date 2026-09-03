# Installs the GitHub Actions runner to auto-start on boot/login
$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Estee\Naap-Library"
$VbsScript = Join-Path $ProjectRoot "scripts\start-actions-runner.vbs"

Write-Host "Installing GitHub Actions Runner auto-start service..." -ForegroundColor Cyan

# 1. Register in HKCU Startup Registry
$RegPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$Cmd = "wscript.exe `"$VbsScript`""
Set-ItemProperty -Path $RegPath -Name "NaapActionsRunner" -Value $Cmd
Write-Host "[OK] Added to HKCU Run Registry ($RegPath\NaapActionsRunner)" -ForegroundColor Green

# 2. Create shortcut in Windows Startup folder
$StartupFolder = [Environment]::GetFolderPath("Startup")
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut((Join-Path $StartupFolder "NaapActionsRunner.lnk"))
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$VbsScript`""
$Shortcut.WorkingDirectory = "C:\actions-runner"
$Shortcut.WindowStyle = 7 # Minimized / Hidden
$Shortcut.Description = "NAAP GitHub Actions Runner"
$Shortcut.Save()
Write-Host "[OK] Created startup shortcut in: $StartupFolder" -ForegroundColor Green

# 3. Start runner now if not running
$existing = Get-Process -Name "Runner.Listener" -ErrorAction SilentlyContinue
if (!$existing) {
    Write-Host "Starting GitHub Actions Runner background daemon..." -ForegroundColor Cyan
    Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
        CommandLine = "wscript.exe `"$VbsScript`""
    } | Out-Null
    Start-Sleep -Seconds 5
}

# 4. Check status
& (Join-Path $ProjectRoot "scripts\status-actions-runner-service.ps1")

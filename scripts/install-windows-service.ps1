# Installs the Face Engine as an automatic background service starting on boot/login
$ErrorActionPreference = "Stop"

$ProjectRoot = "C:\Users\Estee\Naap-Library"
$VbsScript = Join-Path $ProjectRoot "scripts\start-face-engine-daemon.vbs"

Write-Host "Installing NAAP Face Engine auto-start service..." -ForegroundColor Cyan

# 1. Register in HKCU Startup Registry (Standard Windows auto-start used by Herd, OneDrive, etc.)
$RegPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run"
$Cmd = "wscript.exe `"$VbsScript`""
Set-ItemProperty -Path $RegPath -Name "NaapFaceEngine" -Value $Cmd
Write-Host "[OK] Added to HKCU Run Registry ($RegPath\NaapFaceEngine)" -ForegroundColor Green

# 2. Create shortcut in Windows Startup folder for redundancy
$StartupFolder = [Environment]::GetFolderPath("Startup")
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut((Join-Path $StartupFolder "NaapFaceEngine.lnk"))
$Shortcut.TargetPath = "wscript.exe"
$Shortcut.Arguments = "`"$VbsScript`""
$Shortcut.WorkingDirectory = $ProjectRoot
$Shortcut.WindowStyle = 7 # Minimized / Hidden
$Shortcut.Description = "NAAP Face Engine Supervisor Daemon"
$Shortcut.Save()
Write-Host "[OK] Created startup shortcut in: $StartupFolder" -ForegroundColor Green

# 3. Start the service now if not running
$existing = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if (!$existing) {
    Write-Host "Starting Face Engine background service..." -ForegroundColor Cyan
    Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
        CommandLine = "wscript.exe `"$VbsScript`""
    } | Out-Null
    Start-Sleep -Seconds 3
}

# 4. Verify service status
& (Join-Path $ProjectRoot "scripts\status-face-engine-service.ps1")

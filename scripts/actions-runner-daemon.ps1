# GitHub Actions Runner Supervisor Daemon for Windows
$ErrorActionPreference = "Continue"

$RunnerDir = "C:\actions-runner"
$ProjectRoot = "C:\Users\Estee\Naap-Library"
$LogDir = Join-Path $ProjectRoot "storage\logs"
$LogFile = Join-Path $LogDir "actions_runner.log"
$PidFile = Join-Path $LogDir "actions_runner.pid"
$StopFile = Join-Path $LogDir "actions_runner.stop"
$RunCmd = Join-Path $RunnerDir "run.cmd"

if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

if (Test-Path $StopFile) {
    Remove-Item -Path $StopFile -Force -ErrorAction SilentlyContinue
}

Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Actions Runner Daemon: Starting supervisor..."

while (!(Test-Path $StopFile)) {
    try {
        Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Actions Runner Daemon: Launching run.cmd..."

        # Set PATH to include all tools needed by runner
        $env:PATH = "C:\Program Files\Git\cmd;C:\Program Files\nodejs;C:\Users\Estee\.config\herd\bin;C:\Users\Estee\AppData\Local\Python\pythoncore-3.14-64;" + [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")

        $proc = Start-Process -FilePath "cmd.exe" `
            -ArgumentList "/c run.cmd" `
            -WorkingDirectory $RunnerDir `
            -RedirectStandardOutput $LogFile `
            -RedirectStandardError (Join-Path $LogDir "actions_runner_err.log") `
            -WindowStyle Hidden `
            -PassThru

        if ($proc -and !$proc.HasExited) {
            $proc.Id | Out-File -FilePath $PidFile -Encoding ascii -Force
            Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Actions Runner running with PID $($proc.Id)"
            $proc.WaitForExit()
            Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Actions Runner exited with code $($proc.ExitCode)"
        }
    } catch {
        Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Actions Runner Daemon Exception: $_"
    }

    if (Test-Path $PidFile) {
        Remove-Item -Path $PidFile -Force -ErrorAction SilentlyContinue
    }

    if (Test-Path $StopFile) {
        Add-Content -Path $LogFile -Value "[$([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss'))] Actions Runner Daemon: Stop requested. Shutting down."
        Remove-Item -Path $StopFile -Force -ErrorAction SilentlyContinue
        break
    }

    Start-Sleep -Seconds 5
}

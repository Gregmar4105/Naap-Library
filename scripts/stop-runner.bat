@echo off
echo Stopping GitHub Actions Runner...
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "C:\Users\Estee\Naap-Library\scripts\stop-actions-runner-service.ps1"
pause

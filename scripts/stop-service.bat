@echo off
echo Stopping Face Engine background service...
powershell.exe -ExecutionPolicy Bypass -NoProfile -File "C:\Users\Estee\Naap-Library\scripts\stop-face-engine-service.ps1"
pause

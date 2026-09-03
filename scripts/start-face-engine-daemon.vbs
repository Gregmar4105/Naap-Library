Dim objShell
Set objShell = CreateObject("WScript.Shell")
objShell.Run "powershell.exe -ExecutionPolicy Bypass -NoProfile -WindowStyle Hidden -File ""C:\Users\Estee\Naap-Library\scripts\face-engine-daemon.ps1""", 0, False
Set objShell = Nothing

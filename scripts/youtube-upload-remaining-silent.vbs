' Launch the YouTube remaining-upload script with no console window.
' Used by scheduled task LWM-YouTube-remaining-2026-08-24.
Option Explicit
Dim sh, cmd
Set sh = CreateObject("WScript.Shell")
cmd = "powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""C:\Users\tweed\living-word-map\scripts\youtube-upload-remaining.ps1"""
' 0 = hide window, False = do not wait
sh.Run cmd, 0, False

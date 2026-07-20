@echo off
setlocal
echo Living Word Map
echo.

echo Rebuilding data...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-data.ps1"
if errorlevel 1 (
  echo.
  echo build-data.ps1 failed — opening site with last built data if available.
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-prayers.ps1"
if errorlevel 1 (
  echo.
  echo build-prayers.ps1 failed — opening site with last built prayers if available.
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\build-videos.ps1" -SkipCaptions

echo.
echo Starting local server (Brave works best over http://localhost, not file://)...
start "Living Word Map Server" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\serve.ps1"

echo Waiting for http://localhost:8765 ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ok = $false; 1..20 | ForEach-Object { try { $r = Invoke-WebRequest -Uri 'http://localhost:8765/index.html' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { $ok = $true; break } } catch { Start-Sleep -Seconds 1 } }; if (-not $ok) { Write-Host 'Server did not respond.'; exit 1 }"
if errorlevel 1 (
  echo.
  echo Could not connect to the local server.
  echo Open the minimized "Living Word Map Server" window — it may show a port conflict.
  echo Or run restart-server.bat to stop any stale server and try again.
  pause
  exit /b 1
)

echo Opening http://localhost:8765/index.html
start "" "http://localhost:8765/index.html"
echo.
echo If the graph is still blank in Brave:
echo   1. Click the Brave Shields icon and turn Shields OFF for localhost
echo   2. Hard refresh with Ctrl+F5
echo.
echo Leave the minimized "Living Word Map Server" window running while you use the site.
pause

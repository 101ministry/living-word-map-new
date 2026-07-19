@echo off
setlocal
echo Living Word Map — restart server only (no rebuild)
echo.

echo Stopping any existing server on port 8765...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Get-CimInstance Win32_Process -Filter \"Name='powershell.exe'\" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*serve.ps1*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"
timeout /t 1 /nobreak >nul

echo Starting server...
start "Living Word Map Server" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\serve.ps1"

echo Waiting for http://localhost:8765 ...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ok = $false; 1..15 | ForEach-Object { try { $r = Invoke-WebRequest -Uri 'http://localhost:8765/index.html' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { $ok = $true; break } } catch { Start-Sleep -Seconds 1 } }; if (-not $ok) { Write-Host 'Server did not respond. Check the minimized Living Word Map Server window for errors.'; exit 1 }"

if errorlevel 1 (
  echo.
  echo Could not connect. Open the minimized "Living Word Map Server" window to read the error.
  pause
  exit /b 1
)

echo Opening http://localhost:8765/index.html
start "" "http://localhost:8765/index.html"
echo.
echo Server is running. Leave the minimized server window open while you use the site.
pause

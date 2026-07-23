@echo off
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 'http://127.0.0.1:8080/api/menu' | Out-Null; Start-Process 'http://127.0.0.1:8080/'; exit 0 } catch { exit 1 }" >nul 2>&1
if not errorlevel 1 exit /b 0

start "" "%~dp0runtime\pythonw.exe" "%~dp0server.py" --open-browser
exit /b 0

@echo off
cd /d "%~dp0"

if not exist ".server.pid" (
  echo Latte Lab Menu is not running.
  timeout /t 2 >nul
  exit /b 0
)

set /p LATTE_PID=<".server.pid"
taskkill /PID %LATTE_PID% /F >nul 2>&1
del ".server.pid" >nul 2>&1
echo Latte Lab Menu stopped.
timeout /t 2 >nul

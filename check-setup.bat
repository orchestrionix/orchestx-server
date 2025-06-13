@echo off
echo OrchestX Server Setup Checker
echo ============================
echo.

echo 1. Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Node.js is installed
    node --version
) else (
    echo ✗ Node.js is not installed - download from nodejs.org
    goto :end
)

echo.
echo 2. Checking if PM2 is installed...
pm2 --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ PM2 is installed
) else (
    echo ✗ PM2 is not installed - run: npm install -g pm2
    goto :end
)

echo.
echo 3. Checking if application is built...
if exist "dist\app.js" (
    echo ✓ Application is built
) else (
    echo ✗ Application not built - run: npm run build
    goto :end
)

echo.
echo 4. Checking PM2 processes...
pm2 list | findstr "orchestx-server" >nul
if %errorlevel% == 0 (
    echo ✓ OrchestX server is running in PM2
) else (
    echo ✗ OrchestX server is not running - run: pm2 start ecosystem.config.js
)

echo.
echo 5. Checking Windows Task Scheduler...
schtasks /query /tn "OrchestX Server" >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Windows Task Scheduler entry exists
) else (
    echo ✗ Windows Task Scheduler entry missing - run setup-windows-service.bat as Administrator
)

echo.
echo 6. Checking server response...
timeout /t 2 /nobreak >nul
curl -s http://localhost:4000 >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Server is responding at http://localhost:4000
    echo   Your React app should be accessible!
) else (
    echo ✗ Server is not responding at http://localhost:4000
    echo   Check PM2 logs: pm2 logs orchestx-server
)

echo.
echo 7. Checking Windows Firewall for network access...
netsh advfirewall firewall show rule name="OrchestX Server - Port 4000" >nul 2>&1
if %errorlevel% == 0 (
    echo ✓ Windows Firewall rule exists for network access
) else (
    echo ✗ Windows Firewall rule missing - run setup-firewall.bat as Administrator
    echo   This is needed for network access from other devices
)

echo.
echo 8. Checking logs directory...
if exist "logs" (
    echo ✓ Logs directory exists
) else (
    echo ✗ Logs directory missing - it will be created automatically
)

echo.
echo Network Information:
echo ===================
echo Your PC's IP addresses for network access:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    set ip=%%a
    setlocal enabledelayedexpansion
    set ip=!ip: =!
    if not "!ip!"=="127.0.0.1" (
        echo http://!ip!:4000
    )
    endlocal
)

echo.
echo Setup Summary:
echo ==============
call pm2 status

:end
echo.
pause 
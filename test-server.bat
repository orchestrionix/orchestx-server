@echo off
echo Testing OrchestX Server...
echo.

echo Checking PM2 status...
call pm2 status

echo.
echo Testing server response...
curl -s http://localhost:4000 > nul
if %errorlevel% == 0 (
    echo ✓ Server is responding at http://localhost:4000
) else (
    echo ✗ Server is not responding at http://localhost:4000
)

echo.
echo Testing API endpoint...
curl -s http://localhost:4000/api > nul
if %errorlevel% == 0 (
    echo ✓ API is accessible at http://localhost:4000/api
) else (
    echo ✗ API is not accessible at http://localhost:4000/api
)

echo.
echo Recent logs:
call pm2 logs orchestx-server --lines 10

pause 
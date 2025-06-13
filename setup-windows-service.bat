@echo off
echo Setting up OrchestX Server to start automatically on Windows boot...
echo This will create a Windows Task Scheduler entry.
echo.
echo IMPORTANT: This script must be run as Administrator!
echo.
pause

echo Building the application first...
call npm run build

echo Starting the server with PM2...
call pm2 start ecosystem.config.js

echo Saving PM2 configuration...
call pm2 save

echo Creating Windows Task Scheduler entry...
set "CURRENT_DIR=%CD%"
set "TASK_NAME=OrchestX Server"

schtasks /create /tn "%TASK_NAME%" /tr "cmd /c cd /d \"%CURRENT_DIR%\" && pm2 resurrect" /sc onstart /ru "SYSTEM" /f

echo.
echo Setup complete! Your OrchestX Server will now start automatically when Windows boots.
echo.
echo The task has been created in Windows Task Scheduler as: %TASK_NAME%
echo You can access your React app at http://localhost:4000
echo.
echo Useful commands:
echo - pm2 status (view running processes)
echo - pm2 logs orchestx-server (view logs)
echo - pm2 restart orchestx-server (restart server)
echo - pm2 stop orchestx-server (stop server)
echo - pm2 save (save current PM2 processes)
echo.
echo To remove auto-startup: schtasks /delete /tn "%TASK_NAME%" /f
echo.
pause 
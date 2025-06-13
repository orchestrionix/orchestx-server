@echo off
echo Building OrchestX Server...
call npm run build

echo Starting OrchestX Server with PM2...
call pm2 start ecosystem.config.js

echo Server started! You can access it at http://localhost:4000
echo.
echo To view logs: pm2 logs orchestx-server
echo To stop server: pm2 stop orchestx-server
echo To restart server: pm2 restart orchestx-server
echo To view status: pm2 status
pause 
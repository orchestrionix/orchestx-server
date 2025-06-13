@echo off
echo Stopping OrchestX Server...
call pm2 stop orchestx-server
echo Server stopped!
pause 
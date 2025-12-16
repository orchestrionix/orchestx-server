@echo off
setlocal enabledelayedexpansion

REM Directory where this .bat lives
set "APP_DIR=%~dp0"
set "LOG_DIR=%APP_DIR%logs"
set "LOG_FILE=%LOG_DIR%\orchestx-server.log"

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo ================================================== >> "%LOG_FILE%"
echo %DATE% %TIME% - OrchestX Server startup >> "%LOG_FILE%"

cd /d "%APP_DIR%" || (
  echo %DATE% %TIME% - ERROR: Cannot cd to APP_DIR >> "%LOG_FILE%"
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo %DATE% %TIME% - ERROR: Node.js not in PATH >> "%LOG_FILE%"
  exit /b 1
)

node --version >> "%LOG_FILE%" 2>&1

if not exist "dist\app.js" (
  echo %DATE% %TIME% - dist missing, building... >> "%LOG_FILE%"

  if not exist "node_modules" (
    call npm install >> "%LOG_FILE%" 2>&1
    if errorlevel 1 exit /b 1
  )

  call npm run build >> "%LOG_FILE%" 2>&1
  if errorlevel 1 exit /b 1
)

echo %DATE% %TIME% - Starting server >> "%LOG_FILE%"
node dist/app.js >> "%LOG_FILE%" 2>&1

echo %DATE% %TIME% - Server stopped >> "%LOG_FILE%"
exit /b 0

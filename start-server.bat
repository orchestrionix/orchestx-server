@echo off
setlocal enabledelayedexpansion

REM Directory where this .bat lives
set "APP_DIR=%~dp0"

cd /d "%APP_DIR%" || (
  echo ERROR: Cannot cd to APP_DIR
  exit /b 1
)

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js not in PATH
  exit /b 1
)

node --version

if not exist "dist\app.js" (
  echo dist missing, building...

  if not exist "node_modules" (
    call npm install
    if errorlevel 1 exit /b 1
  )

  call npm run build
  if errorlevel 1 exit /b 1
)

echo Starting server
node dist/app.js

echo Server stopped
exit /b 0

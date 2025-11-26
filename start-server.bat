@echo off
echo OrchestX Server - Starting Server
echo ===================================
echo.

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Check if dist folder exists
if not exist "dist\app.js" (
    echo dist folder not found. Building project...
    echo.
    
    REM Check if node_modules exists
    if not exist "node_modules" (
        echo Installing dependencies...
        call npm install
        if %ERRORLEVEL% NEQ 0 (
            echo ERROR: Failed to install dependencies
            pause
            exit /b 1
        )
        echo.
    )
    
    echo Building TypeScript project...
    call npm run build
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Build failed
        pause
        exit /b 1
    )
    echo.
    echo Build completed successfully!
    echo.
)

REM Start the server
echo Starting OrchestX Server...
echo.
echo Server will be available at:
echo   - Local: http://localhost:4000
echo   - Network: http://YOUR_IP:4000
echo.
echo Press Ctrl+C to stop the server
echo ===================================
echo.

node dist/app.js

REM If we get here, the server stopped
echo.
echo Server stopped.
pause


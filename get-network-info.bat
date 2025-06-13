@echo off
echo OrchestX Server - Network Information
echo =======================================
echo.

echo Your PC's Network IP Addresses:
echo --------------------------------
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
    echo%%a
)

echo.
echo Server Access URLs:
echo -------------------
echo Local access: http://localhost:4000
echo.
echo Network access (use these IPs from other devices):
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
echo Windows Firewall Status:
echo ------------------------
netsh advfirewall show allprofiles state | findstr "State"

echo.
echo To allow network access, you may need to:
echo 1. Configure Windows Firewall (see instructions below)
echo 2. Make sure your router allows local network traffic
echo 3. Share the IP address above with other users
echo.
pause 
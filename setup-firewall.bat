@echo off
echo Setting up Windows Firewall for OrchestX Server
echo ===============================================
echo.
echo IMPORTANT: This script must be run as Administrator!
echo This will allow network access to your server on port 4000.
echo.
pause

echo Adding firewall rule for OrchestX Server...
netsh advfirewall firewall add rule name="OrchestX Server - Port 4000" dir=in action=allow protocol=TCP localport=4000

echo.
echo Checking if rule was added successfully...
netsh advfirewall firewall show rule name="OrchestX Server - Port 4000"

echo.
echo Firewall configuration complete!
echo.
echo Your OrchestX Server should now be accessible from other devices on your network.
echo Run 'get-network-info.bat' to see your network IP addresses.
echo.
echo To remove this firewall rule later:
echo netsh advfirewall firewall delete rule name="OrchestX Server - Port 4000"
echo.
pause 
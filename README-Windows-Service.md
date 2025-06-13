# OrchestX Server - Windows Service Setup

This guide will help you set up your OrchestX server to run permanently on Windows and start automatically when the computer boots up.

## Prerequisites

### Node.js Installation Required
**Your Windows PC must have Node.js installed** to run this server:
1. Download Node.js LTS from [nodejs.org](https://nodejs.org/)
2. Install it with default settings
3. Restart your command prompt/PowerShell after installation
4. Verify installation: `node --version` and `npm --version`

## Quick Start

### Option 1: Automatic Setup (Recommended)
1. **Run as Administrator**: Right-click on `setup-windows-service.bat` and select "Run as administrator"
2. Follow the prompts
3. Your server will be accessible at `http://localhost:4000`

### Option 2: Manual Setup
1. Build and start the server: Double-click `start-server.bat`
2. Set up auto-startup manually (see detailed instructions below)

## Network Access Setup

Your server is configured to accept network connections! To allow other devices on your network to access your React app:

### Step 1: Find Your Network IP
Run `get-network-info.bat` to see your PC's IP addresses and access URLs.

### Step 2: Configure Windows Firewall
**Run as Administrator**: Right-click `setup-firewall.bat` and select "Run as administrator"

### Step 3: Share Access URLs
Other devices can access your app using:
- `http://YOUR_PC_IP:4000` (replace YOUR_PC_IP with actual IP from step 1)
- Example: `http://192.168.1.100:4000`

### Network Access Files:
- **`get-network-info.bat`** - Shows your PC's network IP addresses
- **`setup-firewall.bat`** - Configures Windows Firewall (run as Administrator)

## What Gets Installed

- **PM2**: Process manager that keeps your Node.js server running
- **Windows Task**: Scheduled task that starts PM2 on system boot
- **Logging**: Automatic log files in the `logs/` directory

## File Structure

```
orchestx-server/
├── ecosystem.config.js     # PM2 configuration
├── start-server.bat       # Start server manually
├── stop-server.bat        # Stop server
├── setup-windows-service.bat # Auto-setup script
├── logs/                  # Server logs
│   ├── err.log           # Error logs
│   ├── out.log           # Output logs
│   └── combined.log      # Combined logs
└── dist/                 # Compiled TypeScript
    └── app.js            # Main server file
```

## Manual Setup Instructions

### Step 1: Build Your Application
```bash
npm run build
```

### Step 2: Start with PM2
```bash
pm2 start ecosystem.config.js
```

### Step 3: Save PM2 Configuration
```bash
pm2 save
```

### Step 4: Create Windows Task (Run as Administrator)
```bash
schtasks /create /tn "OrchestX Server" /tr "cmd /c cd /d \"C:\path\to\your\project\" && pm2 resurrect" /sc onstart /ru "SYSTEM" /f
```

## Managing Your Server

### View Server Status
```bash
pm2 status
```

### View Logs
```bash
pm2 logs orchestx-server
```

### Restart Server
```bash
pm2 restart orchestx-server
```

### Stop Server
```bash
pm2 stop orchestx-server
```

### Start Server
```bash
pm2 start orchestx-server
```

## Accessing Your Application

- **React App**: `http://localhost:4000`
- **API Endpoints**: `http://localhost:4000/api/...`

## Troubleshooting

### Server Not Starting on Boot
1. Check if the Windows Task exists:
   - Open Task Scheduler
   - Look for "OrchestX Server" task
   - Ensure it's enabled and set to run at startup

2. Check PM2 status:
   ```bash
   pm2 status
   ```

3. Manually resurrect PM2 processes:
   ```bash
   pm2 resurrect
   ```

### Port Already in Use
If port 4000 is already in use, you can change it in `ecosystem.config.js`:
```javascript
env: {
  NODE_ENV: 'production',
  PORT: 3000  // Change to your preferred port
}
```

### Logs Not Appearing
Check the logs directory permissions and ensure PM2 can write to it:
```bash
pm2 flush  # Clear logs
pm2 restart orchestx-server  # Restart to generate new logs
```

### Remove Auto-Startup
To remove the automatic startup:
```bash
schtasks /delete /tn "OrchestX Server" /f
```

## Security Notes

- The server runs on all network interfaces (`0.0.0.0:4000`)
- Make sure your Windows Firewall is properly configured
- Consider changing the default port for production use
- The Windows Task runs as SYSTEM user for reliability

## Support

If you encounter issues:
1. Check the logs in the `logs/` directory
2. Verify PM2 is running: `pm2 status`
3. Check Windows Task Scheduler for the "OrchestX Server" task
4. Ensure you ran the setup as Administrator

## Development vs Production

- **Development**: Use `npm run dev` for hot reloading
- **Production**: Use the PM2 setup described above for stability and auto-restart capabilities 
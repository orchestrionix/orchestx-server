# 🌐 OrchestX Server - Network Access Guide

## ✅ Requirements

### 1. Node.js Installation (REQUIRED)
**Your Windows PC must have Node.js installed:**
- Download from: [nodejs.org](https://nodejs.org/) (get the LTS version)
- Install with default settings
- Restart command prompt after installation
- Verify: `node --version` and `npm --version`

### 2. Your Server Configuration
Your OrchestX server is already configured for network access! It listens on `0.0.0.0:4000`, which means:
- ✅ **Local access**: `http://localhost:4000`
- ✅ **Network access**: `http://YOUR_PC_IP:4000`

## 🚀 Quick Network Setup

### Step 1: Find Your Network IP
```bash
# Run this script to see your network IPs:
.\get-network-info.bat
```

### Step 2: Configure Windows Firewall
```bash
# Run as Administrator to allow network access:
Right-click -> "Run as administrator"
.\setup-firewall.bat
```

### Step 3: Share Your Server
Other devices on your network can now access your React app at:
- `http://192.168.1.27:4000` (example - use your actual IP from Step 1)

## 📱 How Others Access Your App

### From Same Network (WiFi/Ethernet):
1. Get your PC's IP from `get-network-info.bat`
2. Share this URL: `http://YOUR_PC_IP:4000`
3. Others can open it in any web browser

### Example Access URLs:
- **Your PC**: `http://localhost:4000`
- **Phone on same WiFi**: `http://192.168.1.27:4000`
- **Other computers**: `http://192.168.1.27:4000`
- **Tablets**: `http://192.168.1.27:4000`

## 🔧 Troubleshooting Network Access

### Problem: "Can't connect from other devices"

**Solution 1: Check Windows Firewall**
```bash
# Run as Administrator:
.\setup-firewall.bat
```

**Solution 2: Verify Server is Running**
```bash
.\check-setup.bat
```

**Solution 3: Check Your Network**
- Make sure all devices are on the same WiFi network
- Some corporate/public networks block device-to-device communication
- Try from a phone using mobile data hotspot to test

### Problem: "Node.js not found"
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Install it
3. Restart your command prompt
4. Run `node --version` to verify

### Problem: "Different IP address after restart"
- Your router may assign different IP addresses
- Run `get-network-info.bat` again to get the current IP
- Consider setting a static IP in your router settings

## 🔒 Security Considerations

### Current Setup:
- ✅ Server accepts connections from local network only
- ✅ Windows Firewall protects other ports
- ✅ No external internet access (safe)

### For Production Use:
- Consider changing the default port (4000) in `ecosystem.config.js`
- Set up HTTPS if handling sensitive data
- Configure router firewall rules if needed

## 📋 Network Access Checklist

Run `check-setup.bat` to verify everything is working:

- [ ] Node.js installed
- [ ] PM2 installed and running
- [ ] Server responding locally
- [ ] Windows Firewall configured
- [ ] Network IP addresses identified
- [ ] Server accessible from network

## 🎯 Common Use Cases

### Home Network:
- **Family members** can access your app from phones/tablets
- **Multiple computers** in the house can use the same server
- **Smart TVs** with browsers can access the app

### Office Network:
- **Colleagues** can access your development server
- **Testing** on multiple devices simultaneously
- **Demos** without deploying to external servers

### Development:
- **Mobile testing** on real devices
- **Cross-browser testing** on different machines
- **Team collaboration** on local network

## 📞 Getting Help

If you need help:
1. Run `check-setup.bat` for diagnostics
2. Check the logs: `pm2 logs orchestx-server`
3. Verify firewall: Look for "OrchestX Server - Port 4000" rule in Windows Firewall
4. Test locally first: `http://localhost:4000`

Your OrchestX server is now ready for network access! 🎉 
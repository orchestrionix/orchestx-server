import express from 'express';
import routes, { initializeWebSocket } from './routes/index';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { PresenceClient } from './utils/presenceClient';

const app = express();
const PORT = 4000;
const QR_PORT = 4001;
const SIMPLE_PORT = 4002;
        
// Create HTTP server
const server = createServer(app);

// Log ALL incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[INCOMING REQUEST] ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve React build folder
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

// Prevent caching for all API requests and log them
app.use('/api', (req, res, next) => {
  // Set cache-control headers to prevent any caching
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  console.log(`[API Request] ${req.method} ${req.path}`);
  next();
});

// API routes
app.use('/api', routes);

// Serve React app for all unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

// Initialize WebSocket with HTTP server
initializeWebSocket(server);

// Initialize Presence Client
const presenceClient = new PresenceClient();

// Create QR code app server
const qrApp = express();
const qrServer = createServer(qrApp);

// QR app middleware
qrApp.use(cors());
qrApp.use(express.json());

// Serve QR React build folder
const qrBuildPath = path.join(__dirname, 'qr-build');
qrApp.use(express.static(qrBuildPath));

// Hostname and IP API endpoint for QR app
qrApp.get('/api/hostname', (req, res) => {
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    const machineHostname = os.hostname();
    
    // Find the first non-internal IPv4 address (prefer 192.168.x.x or 10.x.x.x)
    let ipAddress = null;
    for (const interfaceName of Object.keys(networkInterfaces)) {
        const addresses = networkInterfaces[interfaceName];
        for (const addr of addresses) {
            // Handle both string ('IPv4') and number (4) family values
            const isIPv4 = addr.family === 'IPv4' || addr.family === 4;
            if (isIPv4 && !addr.internal) {
                // Prefer addresses starting with 192.168 or 10.
                if (addr.address.startsWith('192.168.') || addr.address.startsWith('10.')) {
                    ipAddress = addr.address;
                    break;
                }
                // Otherwise, use the first non-internal IPv4 as fallback
                if (!ipAddress) {
                    ipAddress = addr.address;
                }
            }
        }
        if (ipAddress && ipAddress.startsWith('192.168.')) {
            break;
        }
    }
    
    res.json({ 
        hostname: machineHostname,
        ip: ipAddress || 'localhost'
    });
});

// Serve QR React app for all unknown routes
qrApp.get('*', (req, res) => {
    res.sendFile(path.join(qrBuildPath, 'index.html'));
});

// Create Simplified app server
const simpleApp = express();
const simpleServer = createServer(simpleApp);

// Simplified app middleware
simpleApp.use(cors());
simpleApp.use(express.json());

// Serve Simplified React build folder
const simpleBuildPath = path.join(__dirname, 'simple-build');
simpleApp.use(express.static(simpleBuildPath));

// Serve Simplified React app for all unknown routes
simpleApp.get('*', (req, res) => {
    res.sendFile(path.join(simpleBuildPath, 'index.html'));
});

// Listen on all network interfaces
server.listen(PORT, '0.0.0.0', () => {
    console.log(`OrchestX Server is running at http://0.0.0.0:${PORT}`);
    console.log(`React app should be accessible at http://localhost:${PORT}`);
    console.log(`Build folder location: ${buildPath}`);
    
    // Start presence client after server is listening
    presenceClient.start().catch((error) => {
        console.error('Failed to start presence client:', error);
    });
});

// Start QR code server
qrServer.listen(QR_PORT, '0.0.0.0', () => {
    console.log(`QR Code Server is running at http://0.0.0.0:${QR_PORT}`);
    console.log(`QR app should be accessible at http://localhost:${QR_PORT}`);
    console.log(`QR Build folder location: ${qrBuildPath}`);
});

// Start Simplified app server
simpleServer.listen(SIMPLE_PORT, '0.0.0.0', () => {
    console.log(`Simplified App Server is running at http://0.0.0.0:${SIMPLE_PORT}`);
    console.log(`Simplified app should be accessible at http://localhost:${SIMPLE_PORT}`);
    console.log(`Simplified Build folder location: ${simpleBuildPath}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    presenceClient.stop();
    simpleServer.close(() => {
        console.log('Simplified Server closed');
    });
    qrServer.close(() => {
        console.log('QR Server closed');
    });
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    presenceClient.stop();
    simpleServer.close(() => {
        console.log('Simplified Server closed');
    });
    qrServer.close(() => {
        console.log('QR Server closed');
    });
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;

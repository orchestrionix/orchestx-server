import express from 'express';
import routes, { initializeWebSocket } from './routes/index';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';
import { PresenceClient } from './utils/presenceClient';

const app = express();
const PORT = 4000;
const QR_PORT = 4001;
        
// Create HTTP server
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Serve React build folder
const buildPath = path.join(__dirname, 'build');
app.use(express.static(buildPath));

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

// Hostname API endpoint for QR app
qrApp.get('/api/hostname', (req, res) => {
    const { hostname } = require('os');
    res.json({ hostname: hostname() });
});

// Serve QR React app for all unknown routes
qrApp.get('*', (req, res) => {
    res.sendFile(path.join(qrBuildPath, 'index.html'));
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

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    presenceClient.stop();
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
    qrServer.close(() => {
        console.log('QR Server closed');
    });
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

export default app;

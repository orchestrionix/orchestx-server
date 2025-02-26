import express from 'express';
import routes, { initializeWebSocket } from './routes/index';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';

const app = express();
const PORT = 4000;
        
// Create HTTP server
const server = createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Serve React build folder
app.use(express.static(path.join(__dirname, 'build')));

// API routes
app.use('/api', routes);

// Serve React app for all unknown routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Initialize WebSocket with HTTP server
initializeWebSocket(server);

// Listen on all network interfaces
server.listen(PORT, '0.0.0.0', () => {
    console.log(`OrchestX Server is running at http://0.0.0.0:${PORT}`);
});

export default app;

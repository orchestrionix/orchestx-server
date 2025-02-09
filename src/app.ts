import express from 'express';
import routes, { initializeWebSocket } from './routes/index';
import cors from 'cors'; // Import the cors package
import { createServer } from 'http';

const app = express();
const PORT = 4000;
        
// Create HTTP server
const server = createServer(app);

app.use(cors())
app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({ message: 'OrchestX Express Server' });
});

// Initialize WebSocket with the HTTP server
initializeWebSocket(server);

// Use server.listen instead of app.listen
server.listen(PORT, () => {
    console.log(`OrchestX Server is running at http://localhost:${PORT}`);
});

export default app;

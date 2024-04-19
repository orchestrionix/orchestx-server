import express from 'express';
import routes from './routes/index';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({ message: 'OrchestX Express Server' });
});

app.listen(PORT, () => {
    console.log(`OrchestX Server is running at http://localhost:${PORT}`);
});

export default app;

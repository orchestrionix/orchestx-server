import express from 'express';
import routes from './routes/index';

const app = express();
const PORT = 3000;

app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Express TypeScript server!' });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});

export default app;

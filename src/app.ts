import express from 'express';
import routes from './routes/index';
import cors from 'cors'; // Import the cors package


const app = express();
const PORT = 4000;

app.use(cors())
app.use(express.json());

app.use('/api', routes);

app.get('/', (req, res) => {
    res.json({ message: 'OrchestX Express Server' });
});

app.listen(PORT, () => {
    console.log(`OrchestX Server is running at http://localhost:${PORT}`);
});

export default app;

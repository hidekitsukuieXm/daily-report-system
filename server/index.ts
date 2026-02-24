/**
 * Express サーバーエントリーポイント
 */

import express from 'express';
import cors from 'cors';
import { devAuthMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import reportsRouter from './routes/reports';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/v1/reports', devAuthMiddleware, reportsRouter);

// Error Handler
app.use(errorHandler);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;

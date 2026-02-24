/**
 * Express アプリケーション エントリーポイント
 */
import express from 'express';
import cors from 'cors';
import salespersonsRouter from './routes/salespersons';

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());

// ルート
app.use('/api/v1/salespersons', salespersonsRouter);

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;

/**
 * Express APIサーバー
 */
import express from 'express';
import cors from 'cors';
import approvalsRouter from './routes/approvals';

const app = express();

// ミドルウェア
app.use(cors());
app.use(express.json());

// ルート
app.use('/api/v1', approvalsRouter);

// ヘルスチェック
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 404ハンドラー
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'エンドポイントが見つかりません',
    },
  });
});

// エラーハンドラー
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
);

export default app;

// 直接実行された場合はサーバーを起動
if (require.main === module) {
  const PORT = process.env.PORT ?? 3001;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

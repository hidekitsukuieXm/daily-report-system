/**
 * サーバーテスト用セットアップファイル
 * Node.js環境でのサーバーAPIテスト用
 */

import { vi, afterAll } from 'vitest';

// 環境変数の設定
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-token-secret';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-token-secret';

// テスト終了時のクリーンアップ
afterAll(() => {
  vi.clearAllMocks();
});

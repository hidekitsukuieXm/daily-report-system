/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // グローバルAPI（describe, it, expect等）を自動インポート
    globals: true,

    // テスト環境（サーバーテストはnode）
    environment: 'node',

    // セットアップファイル
    setupFiles: ['./server/__tests__/setup.ts'],

    // テストファイルのパターン
    include: ['server/**/*.{test,spec}.{ts,tsx}'],

    // 除外パターン
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // タイムアウト設定
    testTimeout: 10000,

    // レポーター
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

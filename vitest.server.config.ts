/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * サーバーテスト用のVitest設定
 * Node.js環境でExpressサーバーのAPIテストを実行
 */
export default defineConfig({
  test: {
    // Node.js環境
    environment: 'node',

    // グローバルAPI
    globals: true,

    // サーバーテストのみを対象
    include: ['tests/server/**/*.{test,spec}.ts'],

    // 除外パターン
    exclude: ['node_modules', 'dist'],

    // サーバーテスト用セットアップ
    setupFiles: [path.resolve(__dirname, './tests/server/setup.ts')],

    // タイムアウト設定
    testTimeout: 15000,

    // レポーター
    reporters: ['verbose'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

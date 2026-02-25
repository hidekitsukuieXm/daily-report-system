/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    // テスト環境
    environment: 'jsdom',

    // ルートディレクトリ
    root: __dirname,

    // グローバルAPI（describe, it, expect等）を自動インポート
    globals: true,

    // セットアップファイル
    setupFiles: [path.resolve(__dirname, './src/test/setup.ts')],

    // テストファイルのパターン
    include: ['src/**/*.{test,spec}.{ts,tsx}'],

    // 除外パターン
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // カバレッジ設定
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.{test,spec}.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/**/*.d.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },

    // タイムアウト設定
    testTimeout: 10000,

    // レポーター
    reporters: ['verbose'],

    // CSS モジュールのモック
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

/**
 * MSW サーバー設定
 * Node.js環境（テスト）用のモックサーバー
 */

import { setupServer } from 'msw/node';

import { handlers } from './handlers';

// サーバーインスタンスを作成
export const server = setupServer(...handlers);

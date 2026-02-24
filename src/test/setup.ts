/**
 * テストセットアップファイル
 */

import '@testing-library/jest-dom';

// 環境変数のデフォルト設定
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.UPLOAD_DIR = 'uploads-test';

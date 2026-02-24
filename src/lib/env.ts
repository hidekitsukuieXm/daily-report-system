import { z } from 'zod';

/**
 * 環境変数のスキーマ定義
 * 起動時にバリデーションを行い、型安全な環境変数アクセスを提供
 */

// サーバーサイド環境変数スキーマ
const serverEnvSchema = z.object({
  // アプリケーション設定
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('localhost'),

  // データベース設定
  DATABASE_URL: z
    .string()
    .url('DATABASE_URL must be a valid URL')
    .refine(
      (url) =>
        url.startsWith('postgresql://') || url.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string'
    ),

  // JWT認証設定
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // CORS設定
  CORS_ORIGINS: z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim()))
    .default('http://localhost:3000'),

  // ファイルアップロード設定
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(10485760), // 10MB
  ALLOWED_FILE_TYPES: z
    .string()
    .transform((val) => val.split(',').map((s) => s.trim().toLowerCase()))
    .default('pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png'),

  // ログ設定
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// クライアントサイド環境変数スキーマ（Viteプレフィックス）
const clientEnvSchema = z.object({
  VITE_API_URL: z.string().url().optional(),
  VITE_APP_NAME: z.string().default('営業日報システム'),
});

// サーバーサイド環境変数の型
export type ServerEnv = z.infer<typeof serverEnvSchema>;

// クライアントサイド環境変数の型
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * サーバーサイド環境変数を検証して返す
 * @throws {Error} 環境変数が不正な場合
 */
export function validateServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Environment variable validation failed:');
    console.error(formatZodErrors(result.error));
    throw new Error(
      'Invalid environment variables. Check the console for details.'
    );
  }

  return result.data;
}

/**
 * クライアントサイド環境変数を検証して返す
 * Viteの場合、import.meta.envを使用
 */
export function validateClientEnv(): ClientEnv {
  // Vite環境の場合
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const result = clientEnvSchema.safeParse(import.meta.env);

    if (!result.success) {
      console.error('Client environment variable validation failed:');
      console.error(formatZodErrors(result.error));
      throw new Error('Invalid client environment variables.');
    }

    return result.data;
  }

  // Vite環境でない場合のフォールバック
  return clientEnvSchema.parse({});
}

/**
 * Zodエラーをフォーマット
 */
function formatZodErrors(error: z.ZodError): string {
  return error.errors
    .map((err) => {
      const path = err.path.join('.');
      return `  - ${path}: ${err.message}`;
    })
    .join('\n');
}

/**
 * 環境がプロダクションかどうか
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * 環境が開発かどうか
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 環境がテストかどうか
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

// サーバーサイドで使用する場合の環境変数（遅延初期化）
let _serverEnv: ServerEnv | null = null;

/**
 * サーバーサイド環境変数を取得（シングルトン）
 */
export function getServerEnv(): ServerEnv {
  if (!_serverEnv) {
    _serverEnv = validateServerEnv();
  }
  return _serverEnv;
}

// クライアントサイドで使用する場合の環境変数（遅延初期化）
let _clientEnv: ClientEnv | null = null;

/**
 * クライアントサイド環境変数を取得（シングルトン）
 */
export function getClientEnv(): ClientEnv {
  if (!_clientEnv) {
    _clientEnv = validateClientEnv();
  }
  return _clientEnv;
}

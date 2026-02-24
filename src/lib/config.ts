import { getServerEnv, isProduction, isDevelopment, isTest } from './env';

/**
 * アプリケーション設定
 * 環境に応じた設定値を提供
 */

/** ログレベルの型 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** 環境固有の設定の型 */
export interface AppConfig {
  logging: {
    level: LogLevel;
    prettyPrint: boolean;
    colorize: boolean;
  };
  security: {
    bcryptRounds: number;
    rateLimitMax: number;
    rateLimitWindowMs: number;
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
  debug: {
    showStackTrace: boolean;
    verboseErrors: boolean;
  };
}

// 開発環境のデフォルト設定
const developmentConfig: AppConfig = {
  logging: {
    level: 'debug',
    prettyPrint: true,
    colorize: true,
  },
  security: {
    bcryptRounds: 10,
    rateLimitMax: 1000, // 開発中は緩め
    rateLimitWindowMs: 60 * 1000,
  },
  cache: {
    enabled: false,
    ttl: 60, // 秒
  },
  debug: {
    showStackTrace: true,
    verboseErrors: true,
  },
};

// 本番環境の設定
const productionConfig: AppConfig = {
  logging: {
    level: 'info',
    prettyPrint: false,
    colorize: false,
  },
  security: {
    bcryptRounds: 12,
    rateLimitMax: 100, // 本番は厳しめ
    rateLimitWindowMs: 60 * 1000,
  },
  cache: {
    enabled: true,
    ttl: 300, // 秒
  },
  debug: {
    showStackTrace: false,
    verboseErrors: false,
  },
};

// テスト環境の設定
const testConfig: AppConfig = {
  logging: {
    level: 'warn',
    prettyPrint: false,
    colorize: false,
  },
  security: {
    bcryptRounds: 4, // テストは高速化のため軽め
    rateLimitMax: 10000,
    rateLimitWindowMs: 60 * 1000,
  },
  cache: {
    enabled: false,
    ttl: 0,
  },
  debug: {
    showStackTrace: true,
    verboseErrors: true,
  },
};

/**
 * 現在の環境に応じた設定を取得
 */
function getEnvironmentConfig(): AppConfig {
  if (isProduction()) {
    return productionConfig;
  }
  if (isTest()) {
    return testConfig;
  }
  return developmentConfig;
}

/**
 * アプリケーション全体の設定を生成
 */
export function getAppConfig() {
  const env = getServerEnv();
  const envConfig = getEnvironmentConfig();

  return {
    // 環境変数から取得する設定
    env: {
      nodeEnv: env.NODE_ENV,
      port: env.PORT,
      host: env.HOST,
    },

    // データベース設定
    database: {
      url: env.DATABASE_URL,
    },

    // JWT認証設定
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
    },

    // CORS設定
    cors: {
      origins: env.CORS_ORIGINS,
      credentials: true,
    },

    // ファイルアップロード設定
    upload: {
      dir: env.UPLOAD_DIR,
      maxFileSize: env.MAX_FILE_SIZE,
      allowedTypes: env.ALLOWED_FILE_TYPES,
    },

    // 環境固有の設定
    ...envConfig,
  } as const;
}

export type FullAppConfig = ReturnType<typeof getAppConfig>;

// シングルトンインスタンス
let _appConfig: FullAppConfig | null = null;

/**
 * アプリケーション設定を取得（シングルトン）
 */
export function getConfig(): FullAppConfig {
  if (!_appConfig) {
    _appConfig = getAppConfig();
  }
  return _appConfig;
}

/**
 * 設定をリセット（テスト用）
 */
export function resetConfig(): void {
  _appConfig = null;
}

/**
 * 環境ヘルパー関数を再エクスポート
 */
export { isProduction, isDevelopment, isTest };

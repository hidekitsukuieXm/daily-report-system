/**
 * ロギングミドルウェア
 * リクエスト/レスポンスのログ出力、リクエストID付与
 */

import { NextRequest, NextResponse } from 'next/server';

/** リクエストコンテキスト */
export type RequestContext = {
  requestId: string;
  method: string;
  path: string;
  startTime: number;
};

/**
 * UUIDv4を生成
 */
export function generateRequestId(): string {
  // crypto.randomUUID()が利用可能な場合はそれを使用
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // フォールバック: 簡易的なUUID生成
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * 本番環境かどうかを判定
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * ログレベル
 */
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

/**
 * ログエントリの型
 */
type LogEntry = {
  timestamp: string;
  level: LogLevel;
  requestId?: string;
  message: string;
  data?: Record<string, unknown>;
};

/**
 * ログを出力
 */
function log(entry: LogEntry): void {
  const { timestamp, level, requestId, message, data } = entry;
  const prefix = requestId ? `[${requestId}]` : '';
  const logMessage = `${timestamp} ${level} ${prefix} ${message}`;

  switch (level) {
    case LogLevel.DEBUG:
      if (!isProduction()) {
        console.debug(logMessage, data ?? '');
      }
      break;
    case LogLevel.INFO:
      console.info(logMessage, data ?? '');
      break;
    case LogLevel.WARN:
      console.warn(logMessage, data ?? '');
      break;
    case LogLevel.ERROR:
      console.error(logMessage, data ?? '');
      break;
  }
}

/**
 * リクエストコンテキストを作成
 */
export function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: generateRequestId(),
    method: request.method,
    path: request.nextUrl.pathname,
    startTime: Date.now(),
  };
}

/**
 * リクエストログを出力
 */
export function logRequest(
  context: RequestContext,
  options?: {
    logBody?: boolean;
    logHeaders?: boolean;
    body?: unknown;
    headers?: Record<string, string>;
  }
): void {
  const data: Record<string, unknown> = {
    method: context.method,
    path: context.path,
  };

  if (options?.logHeaders && options.headers) {
    // センシティブなヘッダーをマスク
    const sanitizedHeaders = { ...options.headers };
    if (sanitizedHeaders['authorization']) {
      sanitizedHeaders['authorization'] = '[REDACTED]';
    }
    if (sanitizedHeaders['cookie']) {
      sanitizedHeaders['cookie'] = '[REDACTED]';
    }
    data.headers = sanitizedHeaders;
  }

  if (options?.logBody && options.body && !isProduction()) {
    // 本番環境ではリクエストボディをログに出力しない
    data.body = options.body;
  }

  log({
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    requestId: context.requestId,
    message: `Request: ${context.method} ${context.path}`,
    data,
  });
}

/**
 * レスポンスログを出力
 */
export function logResponse(
  context: RequestContext,
  response: NextResponse,
  options?: {
    logBody?: boolean;
    body?: unknown;
  }
): void {
  const duration = Date.now() - context.startTime;
  const data: Record<string, unknown> = {
    method: context.method,
    path: context.path,
    status: response.status,
    duration: `${duration}ms`,
  };

  if (options?.logBody && options.body && !isProduction()) {
    // 本番環境ではレスポンスボディをログに出力しない
    data.body = options.body;
  }

  const level = response.status >= 400 ? LogLevel.WARN : LogLevel.INFO;

  log({
    timestamp: new Date().toISOString(),
    level,
    requestId: context.requestId,
    message: `Response: ${response.status} (${duration}ms)`,
    data,
  });
}

/**
 * エラーログを出力
 */
export function logError(
  context: RequestContext,
  error: unknown,
  additionalData?: Record<string, unknown>
): void {
  const duration = Date.now() - context.startTime;
  const data: Record<string, unknown> = {
    method: context.method,
    path: context.path,
    duration: `${duration}ms`,
    ...additionalData,
  };

  if (error instanceof Error) {
    data.errorName = error.name;
    data.errorMessage = error.message;
    if (!isProduction()) {
      data.stack = error.stack;
    }
  } else {
    data.error = String(error);
  }

  log({
    timestamp: new Date().toISOString(),
    level: LogLevel.ERROR,
    requestId: context.requestId,
    message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    data,
  });
}

/**
 * デバッグログを出力
 */
export function logDebug(
  context: RequestContext,
  message: string,
  data?: Record<string, unknown>
): void {
  log({
    timestamp: new Date().toISOString(),
    level: LogLevel.DEBUG,
    requestId: context.requestId,
    message,
    data,
  });
}

/**
 * レスポンスにリクエストIDヘッダーを追加
 */
export function addRequestIdHeader(
  response: NextResponse,
  requestId: string
): NextResponse {
  response.headers.set('X-Request-ID', requestId);
  return response;
}

/**
 * APIハンドラをロギングでラップ
 */
export function withLogging<T>(
  handler: (
    request: NextRequest,
    context: RequestContext
  ) => Promise<NextResponse<T>>,
  options?: {
    logRequestBody?: boolean;
    logResponseBody?: boolean;
    logHeaders?: boolean;
  }
): (request: NextRequest) => Promise<NextResponse<T>> {
  return async (request: NextRequest) => {
    const context = createRequestContext(request);

    // リクエストヘッダーを取得
    const headers: Record<string, string> = {};
    if (options?.logHeaders) {
      request.headers.forEach((value, key) => {
        headers[key] = value;
      });
    }

    // リクエストログ
    logRequest(context, {
      logBody: options?.logRequestBody,
      logHeaders: options?.logHeaders,
      headers,
    });

    try {
      const response = await handler(request, context);

      // レスポンスログ
      logResponse(context, response, {
        logBody: options?.logResponseBody,
      });

      // リクエストIDをレスポンスヘッダーに追加
      return addRequestIdHeader(response, context.requestId);
    } catch (error) {
      // エラーログ
      logError(context, error);
      throw error;
    }
  };
}

/**
 * 簡易ロガー（リクエストコンテキスト外で使用）
 */
export const logger = {
  debug: (message: string, data?: Record<string, unknown>) => {
    log({
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      data,
    });
  },
  info: (message: string, data?: Record<string, unknown>) => {
    log({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      data,
    });
  },
  warn: (message: string, data?: Record<string, unknown>) => {
    log({
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      data,
    });
  },
  error: (message: string, data?: Record<string, unknown>) => {
    log({
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      data,
    });
  },
};

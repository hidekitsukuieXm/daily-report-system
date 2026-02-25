/**
 * エラーハンドリングミドルウェア
 * 統一エラーレスポンス形式、エラーログ出力、スタックトレースの非表示（本番）
 */

import { NextResponse } from 'next/server';

/** APIエラーコード */
export const ApiErrorCode = {
  // 認証エラー
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',

  // 権限エラー
  FORBIDDEN: 'FORBIDDEN',
  INVALID_STATUS: 'INVALID_STATUS',

  // リクエストエラー
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  NOT_FOUND: 'NOT_FOUND',

  // 競合エラー
  DUPLICATE_REPORT: 'DUPLICATE_REPORT',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',
  CONFLICT: 'CONFLICT',

  // ビジネスロジックエラー
  NO_VISITS: 'NO_VISITS',

  // ファイルエラー
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',

  // サーバーエラー
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

/** HTTPステータスコードのマッピング */
const errorCodeToStatus: Record<ApiErrorCode, number> = {
  [ApiErrorCode.UNAUTHORIZED]: 401,
  [ApiErrorCode.INVALID_TOKEN]: 401,
  [ApiErrorCode.TOKEN_EXPIRED]: 401,
  [ApiErrorCode.INVALID_CREDENTIALS]: 401,
  [ApiErrorCode.ACCOUNT_DISABLED]: 401,
  [ApiErrorCode.FORBIDDEN]: 403,
  [ApiErrorCode.INVALID_STATUS]: 403,
  [ApiErrorCode.VALIDATION_ERROR]: 422,
  [ApiErrorCode.BAD_REQUEST]: 400,
  [ApiErrorCode.NOT_FOUND]: 404,
  [ApiErrorCode.DUPLICATE_REPORT]: 409,
  [ApiErrorCode.DUPLICATE_EMAIL]: 409,
  [ApiErrorCode.CONFLICT]: 409,
  [ApiErrorCode.NO_VISITS]: 422,
  [ApiErrorCode.FILE_TOO_LARGE]: 413,
  [ApiErrorCode.UNSUPPORTED_FILE_TYPE]: 415,
  [ApiErrorCode.INTERNAL_ERROR]: 500,
};

/** APIエラーレスポンス */
export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

/** APIエラークラス */
export class ApiError extends Error {
  public readonly code: ApiErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = errorCodeToStatus[code];
    this.details = details;
  }

  /**
   * 404 Not Foundエラーを作成
   */
  static notFound(resource: string): ApiError {
    return new ApiError(
      ApiErrorCode.NOT_FOUND,
      `${resource}が見つかりません`
    );
  }

  /**
   * 403 Forbiddenエラーを作成
   */
  static forbidden(message = '権限がありません'): ApiError {
    return new ApiError(ApiErrorCode.FORBIDDEN, message);
  }

  /**
   * 422 Validation Errorを作成
   */
  static validation(
    message: string,
    details?: Record<string, unknown>
  ): ApiError {
    return new ApiError(ApiErrorCode.VALIDATION_ERROR, message, details);
  }

  /**
   * 409 Conflictエラーを作成
   */
  static conflict(message: string): ApiError {
    return new ApiError(ApiErrorCode.CONFLICT, message);
  }

  /**
   * 500 Internal Server Errorを作成
   */
  static internal(message = 'サーバーエラーが発生しました'): ApiError {
    return new ApiError(ApiErrorCode.INTERNAL_ERROR, message);
  }
}

/**
 * 本番環境かどうかを判定
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * エラーをログ出力
 */
export function logError(
  error: unknown,
  context?: {
    requestId?: string;
    method?: string;
    path?: string;
  }
): void {
  const timestamp = new Date().toISOString();
  const prefix = context?.requestId ? `[${context.requestId}]` : '';

  if (error instanceof ApiError) {
    console.error(
      `${timestamp} ${prefix} API Error: ${error.code} - ${error.message}`,
      {
        statusCode: error.statusCode,
        details: error.details,
        method: context?.method,
        path: context?.path,
      }
    );
  } else if (error instanceof Error) {
    console.error(`${timestamp} ${prefix} Unhandled Error: ${error.message}`, {
      name: error.name,
      stack: !isProduction() ? error.stack : undefined,
      method: context?.method,
      path: context?.path,
    });
  } else {
    console.error(`${timestamp} ${prefix} Unknown Error:`, error, {
      method: context?.method,
      path: context?.path,
    });
  }
}

/**
 * エラーからAPIレスポンスを生成
 */
export function createErrorResponse(error: unknown): NextResponse<ApiErrorResponse> {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details && !isProduction() ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode }
    );
  }

  // 予期しないエラー
  const message = isProduction()
    ? 'サーバーエラーが発生しました'
    : error instanceof Error
      ? error.message
      : 'Unknown error';

  return NextResponse.json(
    {
      success: false,
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message,
      },
    },
    { status: 500 }
  );
}

/**
 * APIハンドラをエラーハンドリングでラップ
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>,
  context?: {
    requestId?: string;
    method?: string;
    path?: string;
  }
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error: unknown) => {
    logError(error, context);
    return createErrorResponse(error);
  });
}

/**
 * 成功レスポンスを生成
 */
export function createSuccessResponse<T>(
  data: T,
  status = 200
): NextResponse<{ success: true; data: T }> {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * 204 No Contentレスポンスを生成
 */
export function createNoContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

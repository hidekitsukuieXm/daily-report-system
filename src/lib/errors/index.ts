/**
 * エラーハンドリングユーティリティ
 * API通信およびアプリケーション全体のエラー処理を共通化
 */

import { extractApiError } from '@/lib/api/client';

/**
 * エラーコードの定義
 */
export const ErrorCodes = {
  // 認証エラー
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',

  // 権限エラー
  FORBIDDEN: 'FORBIDDEN',

  // バリデーションエラー
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // リソースエラー
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_REPORT: 'DUPLICATE_REPORT',
  DUPLICATE_EMAIL: 'DUPLICATE_EMAIL',

  // ステータスエラー
  INVALID_STATUS: 'INVALID_STATUS',
  NO_VISITS: 'NO_VISITS',

  // ファイルエラー
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',

  // 通信エラー
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // システムエラー
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * エラーコードに対応する日本語メッセージ
 */
export const errorMessages: Record<ErrorCode, string> = {
  [ErrorCodes.UNAUTHORIZED]: '認証が必要です',
  [ErrorCodes.INVALID_TOKEN]: 'トークンが無効です',
  [ErrorCodes.TOKEN_EXPIRED]: 'セッションの有効期限が切れました',
  [ErrorCodes.INVALID_CREDENTIALS]:
    'メールアドレスまたはパスワードが正しくありません',
  [ErrorCodes.ACCOUNT_DISABLED]:
    'アカウントが無効です。管理者にお問い合わせください',
  [ErrorCodes.FORBIDDEN]: '権限がありません',
  [ErrorCodes.VALIDATION_ERROR]: '入力値が不正です',
  [ErrorCodes.NOT_FOUND]: 'データが見つかりません',
  [ErrorCodes.DUPLICATE_REPORT]: 'この日付の日報は既に存在します',
  [ErrorCodes.DUPLICATE_EMAIL]: 'このメールアドレスは既に登録されています',
  [ErrorCodes.INVALID_STATUS]: 'この状態では操作できません',
  [ErrorCodes.NO_VISITS]: '訪問記録を1件以上入力してください',
  [ErrorCodes.FILE_TOO_LARGE]: 'ファイルサイズは10MB以下にしてください',
  [ErrorCodes.UNSUPPORTED_FILE_TYPE]: 'サポートされていないファイル形式です',
  [ErrorCodes.NETWORK_ERROR]: 'ネットワークエラーが発生しました',
  [ErrorCodes.TIMEOUT_ERROR]: 'リクエストがタイムアウトしました',
  [ErrorCodes.INTERNAL_ERROR]: 'サーバーエラーが発生しました',
  [ErrorCodes.UNKNOWN_ERROR]: '予期しないエラーが発生しました',
};

/**
 * アプリケーションエラークラス
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly originalError?: unknown;

  constructor(code: ErrorCode, message?: string, originalError?: unknown) {
    super(message ?? errorMessages[code] ?? errorMessages[ErrorCodes.UNKNOWN_ERROR]);
    this.name = 'AppError';
    this.code = code;
    this.originalError = originalError;
  }

  /**
   * 認証エラーかどうか
   */
  isAuthError(): boolean {
    const authErrorCodes: ErrorCode[] = [
      ErrorCodes.UNAUTHORIZED,
      ErrorCodes.INVALID_TOKEN,
      ErrorCodes.TOKEN_EXPIRED,
      ErrorCodes.INVALID_CREDENTIALS,
      ErrorCodes.ACCOUNT_DISABLED,
    ];
    return authErrorCodes.includes(this.code);
  }

  /**
   * 権限エラーかどうか
   */
  isForbiddenError(): boolean {
    return this.code === ErrorCodes.FORBIDDEN;
  }

  /**
   * バリデーションエラーかどうか
   */
  isValidationError(): boolean {
    return this.code === ErrorCodes.VALIDATION_ERROR;
  }

  /**
   * ネットワークエラーかどうか
   */
  isNetworkError(): boolean {
    const networkErrorCodes: ErrorCode[] = [
      ErrorCodes.NETWORK_ERROR,
      ErrorCodes.TIMEOUT_ERROR,
    ];
    return networkErrorCodes.includes(this.code);
  }
}

/**
 * 任意のエラーをAppErrorに変換
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  // APIエラーを抽出
  const apiError = extractApiError(error);
  const code = (apiError.code as ErrorCode) ?? ErrorCodes.UNKNOWN_ERROR;

  return new AppError(
    Object.values(ErrorCodes).includes(code) ? code : ErrorCodes.UNKNOWN_ERROR,
    apiError.message,
    error
  );
}

/**
 * エラーからユーザー向けメッセージを取得
 */
export function getErrorMessage(error: unknown): string {
  const appError = toAppError(error);
  return appError.message;
}

/**
 * エラーコードからユーザー向けメッセージを取得
 */
export function getErrorMessageByCode(code: string): string {
  return errorMessages[code as ErrorCode] ?? errorMessages[ErrorCodes.UNKNOWN_ERROR];
}

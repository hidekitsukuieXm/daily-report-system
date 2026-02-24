/**
 * カスタムエラークラス
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(422, 'VALIDATION_ERROR', message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'リソースが見つかりません') {
    super(404, 'NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = '権限がありません') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends AppError {
  constructor(code: string, message: string) {
    super(409, code, message);
    this.name = 'ConflictError';
  }
}

export class InvalidStatusError extends AppError {
  constructor(message: string = 'この状態では操作できません') {
    super(403, 'INVALID_STATUS', message);
    this.name = 'InvalidStatusError';
  }
}

export class FileTooLargeError extends AppError {
  constructor(message: string = 'ファイルサイズは10MB以下にしてください') {
    super(413, 'FILE_TOO_LARGE', message);
    this.name = 'FileTooLargeError';
  }
}

export class UnsupportedFileTypeError extends AppError {
  constructor(message: string = 'サポートされていないファイル形式です') {
    super(415, 'UNSUPPORTED_FILE_TYPE', message);
    this.name = 'UnsupportedFileTypeError';
  }
}

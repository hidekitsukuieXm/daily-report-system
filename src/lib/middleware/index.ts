/**
 * ミドルウェア統合エクスポート
 */

// 認証ミドルウェア
export {
  authMiddleware,
  extractBearerToken,
  verifyToken,
  checkPositionLevel,
  createForbiddenResponse,
  AuthErrorCode,
  type AuthenticatedUser,
  type AuthErrorCode as AuthErrorCodeType,
} from './auth';

// エラーハンドリングミドルウェア
export {
  ApiError,
  ApiErrorCode,
  logError as logApiError,
  createErrorResponse,
  withErrorHandler,
  createSuccessResponse,
  createNoContentResponse,
  type ApiErrorCode as ApiErrorCodeType,
  type ApiErrorResponse,
} from './error';

// バリデーションミドルウェア
export {
  formatZodError,
  createValidationErrorResponse,
  validateRequestBody,
  validateQueryParams,
  validatePathParams,
  validateOrThrow,
  validateIdParam,
  validateContentType,
  validateJsonRequest,
  idParamSchema,
  reportIdParamSchema,
  visitIdParamSchema,
  type ValidationErrorDetail,
  type ValidationResult,
  type IdParam,
} from './validation';

// ロギングミドルウェア
export {
  generateRequestId,
  createRequestContext,
  logRequest,
  logResponse,
  logError,
  logDebug,
  addRequestIdHeader,
  withLogging,
  logger,
  LogLevel,
  type RequestContext,
  type LogLevel as LogLevelType,
} from './logging';

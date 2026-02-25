/**
 * ミドルウェアのテスト
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// JWTモック
vi.mock('@/lib/auth/jwt', () => ({
  decodeToken: vi.fn(),
  isTokenExpired: vi.fn(),
}));

import { decodeToken, isTokenExpired } from '@/lib/auth/jwt';
import {
  authMiddleware,
  extractBearerToken,
  verifyToken,
  checkPositionLevel,
  AuthErrorCode,
} from './auth';
import {
  ApiError,
  ApiErrorCode,
  createErrorResponse,
  createSuccessResponse,
  createNoContentResponse,
  withErrorHandler,
} from './error';
import {
  formatZodError,
  validateOrThrow,
} from './validation';
import {
  generateRequestId,
  createRequestContext,
  logger,
  LogLevel,
} from './logging';

// ヘルパー関数
function createMockRequest(options: {
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: unknown;
}): NextRequest {
  const {
    method = 'GET',
    url = 'http://localhost/api/test',
    headers = {},
    body,
  } = options;

  return new NextRequest(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('auth middleware', () => {
  const mockDecodeToken = decodeToken as ReturnType<typeof vi.fn>;
  const mockIsTokenExpired = isTokenExpired as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('extractBearerToken', () => {
    it('should extract token from Authorization header', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer test-token-123' },
      });

      const token = extractBearerToken(request);
      expect(token).toBe('test-token-123');
    });

    it('should return null if Authorization header is missing', () => {
      const request = createMockRequest({});

      const token = extractBearerToken(request);
      expect(token).toBeNull();
    });

    it('should return null if Authorization header is not Bearer format', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Basic dXNlcjpwYXNz' },
      });

      const token = extractBearerToken(request);
      expect(token).toBeNull();
    });

    it('should return null for empty Bearer token', () => {
      const request = createMockRequest({
        headers: { Authorization: 'Bearer ' },
      });

      const token = extractBearerToken(request);
      expect(token).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('should return valid result for valid token', () => {
      const payload = { userId: 1, email: 'test@example.com', positionLevel: 1 };
      mockDecodeToken.mockReturnValue(payload);
      mockIsTokenExpired.mockReturnValue(false);

      const result = verifyToken('valid-token');

      expect(result.valid).toBe(true);
      expect(result.payload).toEqual(payload);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid result for invalid token', () => {
      mockDecodeToken.mockReturnValue(null);

      const result = verifyToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toBe(AuthErrorCode.INVALID_TOKEN);
    });

    it('should return invalid result for expired token', () => {
      const payload = { userId: 1, email: 'test@example.com', positionLevel: 1 };
      mockDecodeToken.mockReturnValue(payload);
      mockIsTokenExpired.mockReturnValue(true);

      const result = verifyToken('expired-token');

      expect(result.valid).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toBe(AuthErrorCode.TOKEN_EXPIRED);
    });
  });

  describe('authMiddleware', () => {
    it('should return success with user for valid token', () => {
      const payload = { userId: 1, email: 'test@example.com', positionLevel: 2 };
      mockDecodeToken.mockReturnValue(payload);
      mockIsTokenExpired.mockReturnValue(false);

      const request = createMockRequest({
        headers: { Authorization: 'Bearer valid-token' },
      });

      const result = authMiddleware(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.user.userId).toBe(1);
        expect(result.user.email).toBe('test@example.com');
        expect(result.user.positionLevel).toBe(2);
      }
    });

    it('should return unauthorized error for missing token', () => {
      const request = createMockRequest({});

      const result = authMiddleware(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
      }
    });

    it('should return invalid token error', () => {
      mockDecodeToken.mockReturnValue(null);

      const request = createMockRequest({
        headers: { Authorization: 'Bearer invalid-token' },
      });

      const result = authMiddleware(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.response.status).toBe(401);
      }
    });
  });

  describe('checkPositionLevel', () => {
    it('should return true if user level meets requirement', () => {
      const user = { userId: 1, email: 'test@example.com', positionLevel: 3 };
      expect(checkPositionLevel(user, 2)).toBe(true);
    });

    it('should return true if user level equals requirement', () => {
      const user = { userId: 1, email: 'test@example.com', positionLevel: 2 };
      expect(checkPositionLevel(user, 2)).toBe(true);
    });

    it('should return false if user level is below requirement', () => {
      const user = { userId: 1, email: 'test@example.com', positionLevel: 1 };
      expect(checkPositionLevel(user, 2)).toBe(false);
    });
  });
});

describe('error middleware', () => {
  describe('ApiError', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError(ApiErrorCode.NOT_FOUND, 'Resource not found');

      expect(error.code).toBe(ApiErrorCode.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create ApiError with details', () => {
      const details = { field: 'email' };
      const error = new ApiError(
        ApiErrorCode.VALIDATION_ERROR,
        'Validation failed',
        details
      );

      expect(error.details).toEqual(details);
    });

    it('should create not found error via static method', () => {
      const error = ApiError.notFound('日報');

      expect(error.code).toBe(ApiErrorCode.NOT_FOUND);
      expect(error.message).toBe('日報が見つかりません');
    });

    it('should create forbidden error via static method', () => {
      const error = ApiError.forbidden();

      expect(error.code).toBe(ApiErrorCode.FORBIDDEN);
      expect(error.message).toBe('権限がありません');
    });

    it('should create validation error via static method', () => {
      const error = ApiError.validation('入力エラー');

      expect(error.code).toBe(ApiErrorCode.VALIDATION_ERROR);
      expect(error.statusCode).toBe(422);
    });

    it('should create internal error via static method', () => {
      const error = ApiError.internal();

      expect(error.code).toBe(ApiErrorCode.INTERNAL_ERROR);
      expect(error.statusCode).toBe(500);
    });

    it('should create conflict error via static method', () => {
      const error = ApiError.conflict('リソースが競合しています');

      expect(error.code).toBe(ApiErrorCode.CONFLICT);
      expect(error.statusCode).toBe(409);
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response from ApiError', () => {
      const error = new ApiError(ApiErrorCode.NOT_FOUND, 'Not found');
      const response = createErrorResponse(error);

      expect(response.status).toBe(404);
    });

    it('should create 500 response for unknown error', () => {
      const error = new Error('Unknown error');
      const response = createErrorResponse(error);

      expect(response.status).toBe(500);
    });

    it('should create 500 response for non-Error object', () => {
      const error = 'string error';
      const response = createErrorResponse(error);

      expect(response.status).toBe(500);
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'test' };
      const response = createSuccessResponse(data);

      expect(response.status).toBe(200);
    });

    it('should create success response with custom status', () => {
      const data = { id: 1 };
      const response = createSuccessResponse(data, 201);

      expect(response.status).toBe(201);
    });
  });

  describe('createNoContentResponse', () => {
    it('should create 204 response', () => {
      const response = createNoContentResponse();

      expect(response.status).toBe(204);
    });
  });

  describe('withErrorHandler', () => {
    it('should return handler result on success', async () => {
      const mockResponse = NextResponse.json({ success: true }, { status: 200 });
      const handler = vi.fn().mockResolvedValue(mockResponse);

      const result = await withErrorHandler(handler);

      expect(result.status).toBe(200);
    });

    it('should return error response on handler error', async () => {
      const handler = vi.fn().mockRejectedValue(
        new ApiError(ApiErrorCode.NOT_FOUND, 'Not found')
      );

      const result = await withErrorHandler(handler);

      expect(result.status).toBe(404);
    });

    it('should return 500 for generic error', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Generic error'));

      const result = await withErrorHandler(handler);

      expect(result.status).toBe(500);
    });
  });
});

describe('validation middleware', () => {
  describe('formatZodError', () => {
    it('should format Zod errors correctly', () => {
      const schema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email'),
      });

      const result = schema.safeParse({ name: '', email: 'invalid' });

      if (!result.success) {
        const errors = formatZodError(result.error);

        expect(errors.length).toBe(2);
        expect(errors[0]).toHaveProperty('path');
        expect(errors[0]).toHaveProperty('message');
      }
    });

    it('should handle nested path errors', () => {
      const schema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string().min(1),
          }),
        }),
      });

      const result = schema.safeParse({ user: { profile: { name: '' } } });

      if (!result.success) {
        const errors = formatZodError(result.error);
        expect(errors[0].path).toBe('user.profile.name');
      }
    });
  });

  describe('validateOrThrow', () => {
    it('should return data for valid input', () => {
      const schema = z.object({ name: z.string() });

      const data = validateOrThrow({ name: 'test' }, schema);

      expect(data.name).toBe('test');
    });

    it('should throw ApiError for invalid input', () => {
      const schema = z.object({ name: z.string().min(1) });

      expect(() => validateOrThrow({ name: '' }, schema)).toThrow(ApiError);
    });

    it('should throw ApiError with correct code', () => {
      const schema = z.object({ name: z.string().min(1) });

      try {
        validateOrThrow({ name: '' }, schema);
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe(ApiErrorCode.VALIDATION_ERROR);
      }
    });
  });
});

describe('logging middleware', () => {
  let consoleSpy: {
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    debug: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateRequestId', () => {
    it('should generate UUID format string', () => {
      const requestId = generateRequestId();

      expect(requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });

    it('should generate unique IDs', () => {
      const id1 = generateRequestId();
      const id2 = generateRequestId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('createRequestContext', () => {
    it('should create context with request info', () => {
      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost/api/reports',
      });

      const context = createRequestContext(request);

      expect(context.method).toBe('POST');
      expect(context.path).toBe('/api/reports');
      expect(context.requestId).toBeDefined();
      expect(context.startTime).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('logger', () => {
    it('should log info messages', () => {
      logger.info('Test message', { key: 'value' });

      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('Warning message');

      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      logger.error('Error message');

      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('LogLevel', () => {
    it('should have correct log levels', () => {
      expect(LogLevel.DEBUG).toBe('DEBUG');
      expect(LogLevel.INFO).toBe('INFO');
      expect(LogLevel.WARN).toBe('WARN');
      expect(LogLevel.ERROR).toBe('ERROR');
    });
  });
});

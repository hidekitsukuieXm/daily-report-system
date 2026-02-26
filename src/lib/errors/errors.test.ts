/**
 * エラーハンドリングユーティリティのテスト
 */

import { describe, it, expect } from 'vitest';

import {
  AppError,
  ErrorCodes,
  errorMessages,
  toAppError,
  getErrorMessage,
  getErrorMessageByCode,
} from './index';

describe('AppError', () => {
  it('should create error with code and default message', () => {
    const error = new AppError(ErrorCodes.UNAUTHORIZED);

    expect(error.code).toBe(ErrorCodes.UNAUTHORIZED);
    expect(error.message).toBe(errorMessages[ErrorCodes.UNAUTHORIZED]);
    expect(error.name).toBe('AppError');
  });

  it('should create error with custom message', () => {
    const customMessage = 'カスタムエラーメッセージ';
    const error = new AppError(ErrorCodes.VALIDATION_ERROR, customMessage);

    expect(error.code).toBe(ErrorCodes.VALIDATION_ERROR);
    expect(error.message).toBe(customMessage);
  });

  it('should store original error', () => {
    const originalError = new Error('Original error');
    const error = new AppError(
      ErrorCodes.UNKNOWN_ERROR,
      undefined,
      originalError
    );

    expect(error.originalError).toBe(originalError);
  });

  describe('isAuthError', () => {
    it('should return true for auth errors', () => {
      const authCodes = [
        ErrorCodes.UNAUTHORIZED,
        ErrorCodes.INVALID_TOKEN,
        ErrorCodes.TOKEN_EXPIRED,
        ErrorCodes.INVALID_CREDENTIALS,
        ErrorCodes.ACCOUNT_DISABLED,
      ];

      authCodes.forEach((code) => {
        const error = new AppError(code);
        expect(error.isAuthError()).toBe(true);
      });
    });

    it('should return false for non-auth errors', () => {
      const error = new AppError(ErrorCodes.VALIDATION_ERROR);
      expect(error.isAuthError()).toBe(false);
    });
  });

  describe('isForbiddenError', () => {
    it('should return true for forbidden error', () => {
      const error = new AppError(ErrorCodes.FORBIDDEN);
      expect(error.isForbiddenError()).toBe(true);
    });

    it('should return false for non-forbidden errors', () => {
      const error = new AppError(ErrorCodes.UNAUTHORIZED);
      expect(error.isForbiddenError()).toBe(false);
    });
  });

  describe('isValidationError', () => {
    it('should return true for validation error', () => {
      const error = new AppError(ErrorCodes.VALIDATION_ERROR);
      expect(error.isValidationError()).toBe(true);
    });

    it('should return false for non-validation errors', () => {
      const error = new AppError(ErrorCodes.NOT_FOUND);
      expect(error.isValidationError()).toBe(false);
    });
  });

  describe('isNetworkError', () => {
    it('should return true for network errors', () => {
      const networkCodes = [ErrorCodes.NETWORK_ERROR, ErrorCodes.TIMEOUT_ERROR];

      networkCodes.forEach((code) => {
        const error = new AppError(code);
        expect(error.isNetworkError()).toBe(true);
      });
    });

    it('should return false for non-network errors', () => {
      const error = new AppError(ErrorCodes.INTERNAL_ERROR);
      expect(error.isNetworkError()).toBe(false);
    });
  });
});

describe('toAppError', () => {
  it('should return same AppError if already AppError', () => {
    const appError = new AppError(ErrorCodes.VALIDATION_ERROR);
    const result = toAppError(appError);

    expect(result).toBe(appError);
  });

  it('should convert standard Error to AppError', () => {
    const standardError = new Error('Something went wrong');
    const result = toAppError(standardError);

    expect(result).toBeInstanceOf(AppError);
    expect(result.originalError).toBe(standardError);
  });

  it('should handle non-Error objects', () => {
    const result = toAppError('string error');

    expect(result).toBeInstanceOf(AppError);
    expect(result.code).toBe(ErrorCodes.UNKNOWN_ERROR);
  });
});

describe('getErrorMessage', () => {
  it('should return message from AppError', () => {
    const error = new AppError(ErrorCodes.FORBIDDEN);
    const message = getErrorMessage(error);

    expect(message).toBe(errorMessages[ErrorCodes.FORBIDDEN]);
  });

  it('should convert and return message from standard Error', () => {
    const error = new Error('Test error');
    const message = getErrorMessage(error);

    expect(typeof message).toBe('string');
  });
});

describe('getErrorMessageByCode', () => {
  it('should return message for valid error code', () => {
    const message = getErrorMessageByCode(ErrorCodes.NOT_FOUND);

    expect(message).toBe(errorMessages[ErrorCodes.NOT_FOUND]);
  });

  it('should return unknown error message for invalid code', () => {
    const message = getErrorMessageByCode('INVALID_CODE');

    expect(message).toBe(errorMessages[ErrorCodes.UNKNOWN_ERROR]);
  });
});

describe('errorMessages', () => {
  it('should have message for all error codes', () => {
    Object.values(ErrorCodes).forEach((code) => {
      expect(errorMessages[code]).toBeDefined();
      expect(typeof errorMessages[code]).toBe('string');
      expect(errorMessages[code].length).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateServerEnv, isProduction, isDevelopment, isTest } from './env';

describe('env', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateServerEnv', () => {
    it('should validate valid environment variables', () => {
      process.env.DATABASE_URL =
        'postgresql://postgres:password@localhost:5432/test_db';
      process.env.JWT_SECRET =
        'this-is-a-very-long-secret-key-for-testing-purposes';

      const env = validateServerEnv();

      expect(env.DATABASE_URL).toBe(
        'postgresql://postgres:password@localhost:5432/test_db'
      );
      expect(env.JWT_SECRET).toBe(
        'this-is-a-very-long-secret-key-for-testing-purposes'
      );
      expect(env.NODE_ENV).toBe('development');
      expect(env.PORT).toBe(3000);
    });

    it('should throw error when DATABASE_URL is missing', () => {
      process.env.JWT_SECRET =
        'this-is-a-very-long-secret-key-for-testing-purposes';
      delete process.env.DATABASE_URL;

      expect(() => validateServerEnv()).toThrow(
        'Invalid environment variables'
      );
    });

    it('should throw error when JWT_SECRET is too short', () => {
      process.env.DATABASE_URL =
        'postgresql://postgres:password@localhost:5432/test_db';
      process.env.JWT_SECRET = 'short';

      expect(() => validateServerEnv()).toThrow(
        'Invalid environment variables'
      );
    });

    it('should throw error when DATABASE_URL is not a PostgreSQL URL', () => {
      process.env.DATABASE_URL = 'mysql://user:pass@localhost:3306/db';
      process.env.JWT_SECRET =
        'this-is-a-very-long-secret-key-for-testing-purposes';

      expect(() => validateServerEnv()).toThrow(
        'Invalid environment variables'
      );
    });

    it('should use default values for optional variables', () => {
      process.env.DATABASE_URL =
        'postgresql://postgres:password@localhost:5432/test_db';
      process.env.JWT_SECRET =
        'this-is-a-very-long-secret-key-for-testing-purposes';

      const env = validateServerEnv();

      expect(env.PORT).toBe(3000);
      expect(env.HOST).toBe('localhost');
      expect(env.JWT_EXPIRES_IN).toBe('1h');
      expect(env.REFRESH_TOKEN_EXPIRES_IN).toBe('7d');
      expect(env.UPLOAD_DIR).toBe('./uploads');
      expect(env.MAX_FILE_SIZE).toBe(10485760);
      expect(env.LOG_LEVEL).toBe('info');
    });

    it('should parse CORS_ORIGINS as array', () => {
      process.env.DATABASE_URL =
        'postgresql://postgres:password@localhost:5432/test_db';
      process.env.JWT_SECRET =
        'this-is-a-very-long-secret-key-for-testing-purposes';
      process.env.CORS_ORIGINS = 'http://localhost:3000, http://localhost:3001';

      const env = validateServerEnv();

      expect(env.CORS_ORIGINS).toEqual([
        'http://localhost:3000',
        'http://localhost:3001',
      ]);
    });

    it('should parse ALLOWED_FILE_TYPES as array', () => {
      process.env.DATABASE_URL =
        'postgresql://postgres:password@localhost:5432/test_db';
      process.env.JWT_SECRET =
        'this-is-a-very-long-secret-key-for-testing-purposes';
      process.env.ALLOWED_FILE_TYPES = 'pdf, doc, docx';

      const env = validateServerEnv();

      expect(env.ALLOWED_FILE_TYPES).toEqual(['pdf', 'doc', 'docx']);
    });
  });

  describe('environment helpers', () => {
    it('isProduction should return true when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      expect(isProduction()).toBe(true);
    });

    it('isDevelopment should return true when NODE_ENV is development', () => {
      process.env.NODE_ENV = 'development';
      expect(isDevelopment()).toBe(true);
    });

    it('isTest should return true when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      expect(isTest()).toBe(true);
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getConfig, resetConfig } from './config';

describe('config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    resetConfig();
    process.env = { ...originalEnv };
    // 必須の環境変数を設定
    process.env.DATABASE_URL =
      'postgresql://postgres:password@localhost:5432/test_db';
    process.env.JWT_SECRET =
      'this-is-a-very-long-secret-key-for-testing-purposes';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('getConfig', () => {
    it('should return configuration object', () => {
      const config = getConfig();

      expect(config).toBeDefined();
      expect(config.env).toBeDefined();
      expect(config.database).toBeDefined();
      expect(config.jwt).toBeDefined();
      expect(config.cors).toBeDefined();
      expect(config.upload).toBeDefined();
      expect(config.logging).toBeDefined();
      expect(config.security).toBeDefined();
    });

    it('should return singleton instance', () => {
      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).toBe(config2);
    });

    it('should include environment variables', () => {
      process.env.PORT = '4000';
      process.env.HOST = '0.0.0.0';
      resetConfig();

      const config = getConfig();

      expect(config.env.port).toBe(4000);
      expect(config.env.host).toBe('0.0.0.0');
    });

    it('should include JWT configuration', () => {
      process.env.JWT_EXPIRES_IN = '2h';
      process.env.REFRESH_TOKEN_EXPIRES_IN = '14d';
      resetConfig();

      const config = getConfig();

      expect(config.jwt.expiresIn).toBe('2h');
      expect(config.jwt.refreshExpiresIn).toBe('14d');
    });
  });

  describe('environment-specific configuration', () => {
    it('should use development config by default', () => {
      process.env.NODE_ENV = 'development';
      resetConfig();

      const config = getConfig();

      expect(config.logging.level).toBe('debug');
      expect(config.logging.prettyPrint).toBe(true);
      expect(config.security.bcryptRounds).toBe(10);
      expect(config.cache.enabled).toBe(false);
      expect(config.debug.showStackTrace).toBe(true);
    });

    it('should use production config when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      resetConfig();

      const config = getConfig();

      expect(config.logging.level).toBe('info');
      expect(config.logging.prettyPrint).toBe(false);
      expect(config.security.bcryptRounds).toBe(12);
      expect(config.cache.enabled).toBe(true);
      expect(config.debug.showStackTrace).toBe(false);
    });

    it('should use test config when NODE_ENV is test', () => {
      process.env.NODE_ENV = 'test';
      resetConfig();

      const config = getConfig();

      expect(config.logging.level).toBe('warn');
      expect(config.security.bcryptRounds).toBe(4);
      expect(config.cache.enabled).toBe(false);
    });
  });

  describe('CORS configuration', () => {
    it('should parse CORS_ORIGINS correctly', () => {
      process.env.CORS_ORIGINS =
        'http://localhost:3000, https://example.com';
      resetConfig();

      const config = getConfig();

      expect(config.cors.origins).toEqual([
        'http://localhost:3000',
        'https://example.com',
      ]);
      expect(config.cors.credentials).toBe(true);
    });
  });

  describe('upload configuration', () => {
    it('should include upload settings', () => {
      process.env.UPLOAD_DIR = '/var/uploads';
      process.env.MAX_FILE_SIZE = '5242880';
      process.env.ALLOWED_FILE_TYPES = 'pdf,jpg,png';
      resetConfig();

      const config = getConfig();

      expect(config.upload.dir).toBe('/var/uploads');
      expect(config.upload.maxFileSize).toBe(5242880);
      expect(config.upload.allowedTypes).toEqual(['pdf', 'jpg', 'png']);
    });
  });

  describe('resetConfig', () => {
    it('should reset the singleton instance', () => {
      const config1 = getConfig();
      resetConfig();

      process.env.PORT = '5000';
      const config2 = getConfig();

      expect(config1.env.port).not.toBe(config2.env.port);
    });
  });
});

/**
 * JWT Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessTokenExpiresIn,
  type TokenPayload,
} from '../../../src/server/lib/jwt';

describe('JWT Utilities', () => {
  const testPayload: TokenPayload = {
    userId: 1,
    email: 'test@example.com',
    positionLevel: 2,
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = generateAccessToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate different tokens for different rememberMe values', () => {
      const tokenWithRemember = generateRefreshToken(testPayload, true);
      const tokenWithoutRemember = generateRefreshToken(testPayload, false);
      // Tokens will have different expiration times
      expect(tokenWithRemember).not.toBe(tokenWithoutRemember);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
      expect(decoded?.positionLevel).toBe(testPayload.positionLevel);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyAccessToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for refresh token (wrong secret)', () => {
      const refreshToken = generateRefreshToken(testPayload);
      const decoded = verifyAccessToken(refreshToken);
      expect(decoded).toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(testPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
      expect(decoded?.positionLevel).toBe(testPayload.positionLevel);
    });

    it('should return null for invalid token', () => {
      const decoded = verifyRefreshToken('invalid-token');
      expect(decoded).toBeNull();
    });

    it('should return null for access token (wrong secret)', () => {
      const accessToken = generateAccessToken(testPayload);
      const decoded = verifyRefreshToken(accessToken);
      expect(decoded).toBeNull();
    });
  });

  describe('getAccessTokenExpiresIn', () => {
    it('should return 3600 seconds (1 hour)', () => {
      const expiresIn = getAccessTokenExpiresIn();
      expect(expiresIn).toBe(3600);
    });
  });

  describe('Token expiration', () => {
    it('should include exp field in decoded token', () => {
      const token = generateAccessToken(testPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded?.exp).toBeDefined();
      expect(decoded?.iat).toBeDefined();
      expect(decoded!.exp).toBeGreaterThan(decoded!.iat);
    });
  });
});

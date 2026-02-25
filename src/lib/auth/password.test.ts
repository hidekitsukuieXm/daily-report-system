/**
 * パスワードユーティリティのテスト
 */

import { describe, it, expect } from 'vitest';

import {
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  verifyPasswordSync,
} from './password';

describe('password utilities', () => {
  const testPassword = 'TestPassword123';

  describe('hashPassword', () => {
    it('should hash password asynchronously', async () => {
      const hash = await hashPassword(testPassword);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(testPassword);
      expect(hash.startsWith('$2')).toBe(true); // bcrypt hash prefix
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('hashPasswordSync', () => {
    it('should hash password synchronously', () => {
      const hash = hashPasswordSync(testPassword);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(testPassword);
      expect(hash.startsWith('$2')).toBe(true);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword(testPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await hashPassword(testPassword);
      const isValid = await verifyPassword('WrongPassword', hash);

      expect(isValid).toBe(false);
    });
  });

  describe('verifyPasswordSync', () => {
    it('should verify correct password synchronously', () => {
      const hash = hashPasswordSync(testPassword);
      const isValid = verifyPasswordSync(testPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password synchronously', () => {
      const hash = hashPasswordSync(testPassword);
      const isValid = verifyPasswordSync('WrongPassword', hash);

      expect(isValid).toBe(false);
    });
  });
});

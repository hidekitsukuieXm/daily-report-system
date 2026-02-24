/**
 * Authentication Routes Tests
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import app from '../../../src/server/index';
import { prisma } from '../../../src/server/lib/prisma';
import { hashPassword } from '../../../src/lib/auth/password';
import { generateAccessToken, type TokenPayload } from '../../../src/server/lib/jwt';

// Mock Prisma
vi.mock('../../../src/server/lib/prisma', () => ({
  prisma: {
    salesperson: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Auth Routes', () => {
  const mockSalesperson = {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    password: '', // Will be set in beforeAll
    positionId: 1,
    managerId: null,
    directorId: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    position: {
      id: 1,
      name: '担当',
      level: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const validToken = generateAccessToken({
    userId: 1,
    email: 'yamada@example.com',
    positionLevel: 1,
  });

  beforeAll(async () => {
    // Hash password for mock user
    mockSalesperson.password = await hashPassword('password123');
  });

  afterAll(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      vi.mocked(prisma.salesperson.findUnique).mockResolvedValue(mockSalesperson);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'yamada@example.com',
          password: 'password123',
          remember: false,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('access_token');
      expect(response.body.data).toHaveProperty('refresh_token');
      expect(response.body.data.token_type).toBe('Bearer');
      expect(response.body.data.user.email).toBe('yamada@example.com');
    });

    it('should return 401 for invalid email', async () => {
      vi.mocked(prisma.salesperson.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for invalid password', async () => {
      vi.mocked(prisma.salesperson.findUnique).mockResolvedValue(mockSalesperson);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'yamada@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for disabled account', async () => {
      vi.mocked(prisma.salesperson.findUnique).mockResolvedValue({
        ...mockSalesperson,
        isActive: false,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'yamada@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCOUNT_DISABLED');
    });

    it('should return 422 for missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 422 for missing password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'yamada@example.com',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 422 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('should return user info with valid token', async () => {
      vi.mocked(prisma.salesperson.findUnique).mockResolvedValue(mockSalesperson);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.name).toBe('山田太郎');
      expect(response.body.data.email).toBe('yamada@example.com');
    });

    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/v1/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 if user not found', async () => {
      vi.mocked(prisma.salesperson.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/auth/password', () => {
    it('should change password successfully', async () => {
      vi.mocked(prisma.salesperson.findUnique).mockResolvedValue(mockSalesperson);
      vi.mocked(prisma.salesperson.update).mockResolvedValue(mockSalesperson);

      const response = await request(app)
        .put('/api/v1/auth/password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          current_password: 'password123',
          new_password: 'newpassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for wrong current password', async () => {
      vi.mocked(prisma.salesperson.findUnique).mockResolvedValue(mockSalesperson);

      const response = await request(app)
        .put('/api/v1/auth/password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          current_password: 'wrongpassword',
          new_password: 'newpassword123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('should return 422 for short new password', async () => {
      const response = await request(app)
        .put('/api/v1/auth/password')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          current_password: 'password123',
          new_password: 'short',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .put('/api/v1/auth/password')
        .send({
          current_password: 'password123',
          new_password: 'newpassword123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 401 without refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refresh_token: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Health check', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});

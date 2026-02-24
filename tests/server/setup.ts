/**
 * テストセットアップ - Prismaモック
 */
import { vi, beforeEach } from 'vitest';

// Prismaクライアントのモック
export const mockPrisma = {
  salesperson: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  position: {
    findUnique: vi.fn(),
  },
};

// Prismaモジュールをモック
vi.mock('../../src/server/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// bcryptjsモジュールをモック
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.clearAllMocks();
});

// テスト用ユーザーデータ
export const mockDirector = {
  userId: 1,
  email: 'director@example.com',
  positionLevel: 3, // 部長
};

export const mockManager = {
  userId: 2,
  email: 'manager@example.com',
  positionLevel: 2, // 課長
};

export const mockStaff = {
  userId: 3,
  email: 'staff@example.com',
  positionLevel: 1, // 担当
};

// JWTモック
vi.mock('../../src/server/lib/jwt', () => ({
  verifyAccessToken: vi.fn((token: string) => {
    if (token === 'director_token') return mockDirector;
    if (token === 'manager_token') return mockManager;
    if (token === 'staff_token') return mockStaff;
    throw new Error('Invalid token');
  }),
}));

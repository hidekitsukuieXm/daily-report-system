/**
 * サーバーテスト用セットアップ
 */
import { vi } from 'vitest';

// Prisma クライアントのモック
export const mockPrisma = {
  dailyReport: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  visitRecord: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  customer: {
    findUnique: vi.fn(),
  },
  salesperson: {
    findUnique: vi.fn(),
  },
};

// Prismaモジュールをモック
vi.mock('../../src/server/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// JWTモジュールをモック
vi.mock('../../src/server/lib/jwt', () => ({
  verifyAccessToken: vi.fn(),
  generateAccessToken: vi.fn(),
  generateRefreshToken: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

// テスト用のユーザーデータ
export const testUser = {
  userId: 1,
  email: 'test@example.com',
  positionLevel: 1,
};

// テスト用の日報データ
export const testReport = {
  id: 1,
  salespersonId: 1,
  reportDate: new Date('2024-01-15'),
  problem: null,
  plan: null,
  status: 'draft',
  submittedAt: null,
  managerApprovedAt: null,
  directorApprovedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  salesperson: {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    positionId: 1,
    managerId: null,
    directorId: null,
    isActive: true,
  },
};

// テスト用の顧客データ
export const testCustomer = {
  id: 1,
  name: '株式会社ABC',
  address: '東京都渋谷区',
  phone: '03-1234-5678',
  industry: '製造業',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// テスト用の訪問記録データ
export const testVisitRecord = {
  id: 1,
  dailyReportId: 1,
  customerId: 1,
  visitTime: new Date('1970-01-01T10:00:00'),
  content: '新商品の提案を実施',
  result: 'negotiating',
  createdAt: new Date(),
  updatedAt: new Date(),
  customer: {
    id: 1,
    name: '株式会社ABC',
  },
  attachments: [],
  dailyReport: testReport,
};

// 認証ヘッダーを生成
export function getAuthHeader(token = 'valid-token'): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

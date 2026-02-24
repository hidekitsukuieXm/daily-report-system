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
    count: vi.fn(),
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
  approvalHistory: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
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

// テスト用のユーザーデータ（担当者）
export const testStaffUser = {
  userId: 1,
  email: 'staff@example.com',
  positionLevel: 1,
};

// テスト用のユーザーデータ（課長）
export const testManagerUser = {
  userId: 2,
  email: 'manager@example.com',
  positionLevel: 2,
};

// テスト用のユーザーデータ（部長）
export const testDirectorUser = {
  userId: 3,
  email: 'director@example.com',
  positionLevel: 3,
};

// テスト用の日報データ（提出済み）
export const testSubmittedReport = {
  id: 1,
  salespersonId: 1,
  reportDate: new Date('2024-01-15'),
  problem: null,
  plan: null,
  status: 'submitted',
  submittedAt: new Date('2024-01-15T18:00:00'),
  managerApprovedAt: null,
  directorApprovedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  salesperson: {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    positionId: 1,
    managerId: 2, // 課長が上司
    directorId: 3,
    isActive: true,
  },
  _count: {
    visitRecords: 3,
  },
};

// テスト用の日報データ（課長承認済み）
export const testManagerApprovedReport = {
  ...testSubmittedReport,
  id: 2,
  status: 'manager_approved',
  managerApprovedAt: new Date('2024-01-15T19:00:00'),
};

// テスト用の日報データ（下書き）
export const testDraftReport = {
  ...testSubmittedReport,
  id: 3,
  status: 'draft',
  submittedAt: null,
};

// 認証ヘッダーを生成
export function getAuthHeader(token = 'valid-token'): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

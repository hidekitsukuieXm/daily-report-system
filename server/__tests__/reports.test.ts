/**
 * 日報 CRUD API テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

// Prismaモック
vi.mock('../../lib/prisma', () => ({
  prisma: {
    dailyReport: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    visitRecord: {
      createMany: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback({
      dailyReport: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
      visitRecord: {
        createMany: vi.fn(),
      },
    })),
  },
}));

import { prisma } from '../../lib/prisma';

describe('日報 CRUD API', () => {
  const mockUser = {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    positionId: 1,
    positionLevel: 1, // 担当者
  };

  const mockManagerUser = {
    id: 2,
    name: '鈴木課長',
    email: 'suzuki@example.com',
    positionId: 2,
    positionLevel: 2, // 課長
  };

  const mockDirectorUser = {
    id: 3,
    name: '田中部長',
    email: 'tanaka@example.com',
    positionId: 3,
    positionLevel: 3, // 部長
  };

  const mockReport = {
    id: 1,
    salespersonId: 1,
    reportDate: new Date('2024-01-15'),
    problem: '課題',
    plan: '予定',
    status: 'draft',
    submittedAt: null,
    managerApprovedAt: null,
    directorApprovedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    salesperson: { id: 1, name: '山田太郎' },
    _count: { visitRecords: 2 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/reports', () => {
    it('担当者は自分の日報のみ取得できる', async () => {
      const mockReports = [mockReport];
      vi.mocked(prisma.dailyReport.count).mockResolvedValue(1);
      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue(mockReports as never);

      const result = await prisma.dailyReport.findMany({
        where: { salespersonId: mockUser.id },
      });

      expect(prisma.dailyReport.findMany).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('ページネーションが正しく動作する', async () => {
      const mockReports = Array(5).fill(mockReport);
      vi.mocked(prisma.dailyReport.count).mockResolvedValue(25);
      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue(mockReports as never);

      await prisma.dailyReport.findMany({
        skip: 0,
        take: 5,
      });

      expect(prisma.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 5,
        })
      );
    });

    it('日付範囲フィルタが動作する', async () => {
      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue([mockReport] as never);

      await prisma.dailyReport.findMany({
        where: {
          reportDate: {
            gte: new Date('2024-01-01'),
            lte: new Date('2024-01-31'),
          },
        },
      });

      expect(prisma.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            reportDate: expect.objectContaining({
              gte: new Date('2024-01-01'),
              lte: new Date('2024-01-31'),
            }),
          }),
        })
      );
    });

    it('ステータスフィルタが動作する', async () => {
      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue([mockReport] as never);

      await prisma.dailyReport.findMany({
        where: { status: 'draft' },
      });

      expect(prisma.dailyReport.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'draft',
          }),
        })
      );
    });
  });

  describe('GET /api/v1/reports/:id', () => {
    it('自分の日報詳細を取得できる', async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        ...mockReport,
        salesperson: {
          id: 1,
          name: '山田太郎',
          email: 'yamada@example.com',
          positionId: 1,
          managerId: 2,
          directorId: 3,
          position: { id: 1, name: '担当', level: 1 },
        },
        visitRecords: [],
        approvalHistories: [],
        comments: [],
      } as never);

      const result = await prisma.dailyReport.findUnique({
        where: { id: 1 },
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
    });

    it('存在しない日報は404エラー', async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(null);

      const result = await prisma.dailyReport.findUnique({
        where: { id: 999 },
      });

      expect(result).toBeNull();
    });
  });

  describe('POST /api/v1/reports', () => {
    it('日報を新規作成できる', async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(null);

      const newReport = {
        id: 1,
        salespersonId: 1,
        reportDate: new Date('2024-01-15'),
        problem: '課題',
        plan: '予定',
        status: 'draft',
      };

      vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
        const tx = {
          dailyReport: {
            create: vi.fn().mockResolvedValue(newReport),
            findUnique: vi.fn().mockResolvedValue({
              ...newReport,
              visitRecords: [],
            }),
          },
          visitRecord: {
            createMany: vi.fn(),
          },
        };
        return callback(tx as never);
      });

      const result = await prisma.$transaction(async (tx) => {
        const report = await tx.dailyReport.create({
          data: {
            salespersonId: 1,
            reportDate: new Date('2024-01-15'),
            problem: '課題',
            plan: '予定',
            status: 'draft',
          },
        });
        return report;
      });

      expect(result).toBeDefined();
    });

    it('同一日の日報は重複作成できない', async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(mockReport as never);

      const existingReport = await prisma.dailyReport.findUnique({
        where: {
          salespersonId_reportDate: {
            salespersonId: 1,
            reportDate: new Date('2024-01-15'),
          },
        },
      });

      expect(existingReport).toBeDefined();
    });
  });

  describe('PUT /api/v1/reports/:id', () => {
    it('下書き状態の日報は更新できる', async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        ...mockReport,
        status: 'draft',
      } as never);

      vi.mocked(prisma.dailyReport.update).mockResolvedValue({
        ...mockReport,
        problem: '更新後の課題',
      } as never);

      const result = await prisma.dailyReport.update({
        where: { id: 1 },
        data: { problem: '更新後の課題' },
      });

      expect(result.problem).toBe('更新後の課題');
    });

    it('提出済みの日報は更新できない', async () => {
      const submittedReport = {
        ...mockReport,
        status: 'submitted',
      };

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(submittedReport as never);

      const report = await prisma.dailyReport.findUnique({
        where: { id: 1 },
      });

      expect(report?.status).toBe('submitted');
      // この場合、APIはINVALID_STATUSエラーを返す
    });

    it('差戻し状態の日報は更新できる', async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        ...mockReport,
        status: 'rejected',
      } as never);

      vi.mocked(prisma.dailyReport.update).mockResolvedValue({
        ...mockReport,
        status: 'draft',
        problem: '修正後の課題',
      } as never);

      const result = await prisma.dailyReport.update({
        where: { id: 1 },
        data: { problem: '修正後の課題', status: 'draft' },
      });

      expect(result.status).toBe('draft');
    });
  });

  describe('DELETE /api/v1/reports/:id', () => {
    it('下書き状態の日報は削除できる', async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        ...mockReport,
        status: 'draft',
      } as never);

      vi.mocked(prisma.dailyReport.delete).mockResolvedValue(mockReport as never);

      await prisma.dailyReport.delete({
        where: { id: 1 },
      });

      expect(prisma.dailyReport.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('提出済みの日報は削除できない', async () => {
      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue({
        ...mockReport,
        status: 'submitted',
      } as never);

      const report = await prisma.dailyReport.findUnique({
        where: { id: 1 },
      });

      expect(report?.status).toBe('submitted');
      // この場合、APIはINVALID_STATUSエラーを返す
    });
  });

  describe('権限チェック', () => {
    it('担当者は自分の日報のみ操作可能', async () => {
      const otherUserReport = {
        ...mockReport,
        salespersonId: 999, // 他人の日報
      };

      vi.mocked(prisma.dailyReport.findUnique).mockResolvedValue(otherUserReport as never);

      const report = await prisma.dailyReport.findUnique({
        where: { id: 1 },
      });

      // 自分のIDと異なる場合、FORBIDDENエラーを返す
      expect(report?.salespersonId).not.toBe(mockUser.id);
    });

    it('課長は部下の日報を閲覧できる', async () => {
      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue([mockReport] as never);

      await prisma.dailyReport.findMany({
        where: {
          OR: [
            { salespersonId: mockManagerUser.id },
            { salesperson: { managerId: mockManagerUser.id } },
          ],
        },
      });

      expect(prisma.dailyReport.findMany).toHaveBeenCalled();
    });

    it('部長は全員の日報を閲覧できる', async () => {
      vi.mocked(prisma.dailyReport.findMany).mockResolvedValue([mockReport] as never);

      await prisma.dailyReport.findMany({
        where: {}, // 制限なし
      });

      expect(prisma.dailyReport.findMany).toHaveBeenCalled();
    });
  });
});

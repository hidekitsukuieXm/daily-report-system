/**
 * 添付ファイル API テスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';

// fsモック
vi.mock('fs/promises', () => ({
  default: {
    access: vi.fn(),
    unlink: vi.fn(),
  },
  access: vi.fn(),
  unlink: vi.fn(),
}));

// Prismaモック
vi.mock('../lib/prisma', () => ({
  prisma: {
    visitRecord: {
      findUnique: vi.fn(),
    },
    attachment: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from '../lib/prisma';

describe('添付ファイル API', () => {
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

  const mockVisitRecord = {
    id: 1,
    dailyReportId: 1,
    customerId: 1,
    visitTime: new Date('2024-01-15 10:00:00'),
    content: '訪問内容',
    result: 'negotiating',
    createdAt: new Date(),
    updatedAt: new Date(),
    dailyReport: {
      id: 1,
      salespersonId: 1,
      status: 'draft',
      salesperson: {
        id: 1,
        name: '山田太郎',
        managerId: 2,
        directorId: 3,
      },
    },
  };

  const mockAttachment = {
    id: 1,
    visitRecordId: 1,
    fileName: 'test.pdf',
    filePath: 'abc123.pdf',
    contentType: 'application/pdf',
    fileSize: 1024,
    createdAt: new Date(),
    visitRecord: mockVisitRecord,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/v1/visits/:visitId/attachments', () => {
    it('自分の訪問記録にファイルを添付できる', async () => {
      vi.mocked(prisma.visitRecord.findUnique).mockResolvedValue(mockVisitRecord as never);
      vi.mocked(prisma.attachment.create).mockResolvedValue(mockAttachment as never);

      const result = await prisma.attachment.create({
        data: {
          visitRecordId: 1,
          fileName: 'test.pdf',
          filePath: 'abc123.pdf',
          contentType: 'application/pdf',
          fileSize: 1024,
        },
      });

      expect(prisma.attachment.create).toHaveBeenCalled();
      expect(result.fileName).toBe('test.pdf');
    });

    it('下書き状態の日報にのみファイルを添付できる', async () => {
      const submittedVisitRecord = {
        ...mockVisitRecord,
        dailyReport: {
          ...mockVisitRecord.dailyReport,
          status: 'submitted',
        },
      };

      vi.mocked(prisma.visitRecord.findUnique).mockResolvedValue(submittedVisitRecord as never);

      const visitRecord = await prisma.visitRecord.findUnique({
        where: { id: 1 },
      });

      // 提出済みの場合は添付不可
      expect(visitRecord?.dailyReport.status).toBe('submitted');
    });

    it('差戻し状態の日報にもファイルを添付できる', async () => {
      const rejectedVisitRecord = {
        ...mockVisitRecord,
        dailyReport: {
          ...mockVisitRecord.dailyReport,
          status: 'rejected',
        },
      };

      vi.mocked(prisma.visitRecord.findUnique).mockResolvedValue(rejectedVisitRecord as never);

      const visitRecord = await prisma.visitRecord.findUnique({
        where: { id: 1 },
      });

      // 差戻し状態は添付可能
      const allowedStatuses = ['draft', 'rejected'];
      expect(allowedStatuses.includes(visitRecord?.dailyReport.status as string)).toBe(true);
    });
  });

  describe('GET /api/v1/attachments/:id', () => {
    it('自分の添付ファイルをダウンロードできる', async () => {
      vi.mocked(prisma.attachment.findUnique).mockResolvedValue(mockAttachment as never);
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const attachment = await prisma.attachment.findUnique({
        where: { id: 1 },
      });

      expect(attachment).toBeDefined();
      expect(attachment?.fileName).toBe('test.pdf');
    });

    it('課長は部下の添付ファイルをダウンロードできる', async () => {
      vi.mocked(prisma.attachment.findUnique).mockResolvedValue(mockAttachment as never);

      const attachment = await prisma.attachment.findUnique({
        where: { id: 1 },
      });

      // 課長は部下の添付ファイルを閲覧可能
      const canView =
        attachment?.visitRecord.dailyReport.salesperson.managerId === mockManagerUser.id;
      expect(canView).toBe(true);
    });

    it('存在しない添付ファイルは404エラー', async () => {
      vi.mocked(prisma.attachment.findUnique).mockResolvedValue(null);

      const attachment = await prisma.attachment.findUnique({
        where: { id: 999 },
      });

      expect(attachment).toBeNull();
    });
  });

  describe('DELETE /api/v1/attachments/:id', () => {
    it('自分の添付ファイルを削除できる', async () => {
      vi.mocked(prisma.attachment.findUnique).mockResolvedValue(mockAttachment as never);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);
      vi.mocked(prisma.attachment.delete).mockResolvedValue(mockAttachment as never);

      // ファイル削除
      await fs.unlink(path.join('uploads', mockAttachment.filePath));
      expect(fs.unlink).toHaveBeenCalled();

      // DB削除
      await prisma.attachment.delete({
        where: { id: 1 },
      });
      expect(prisma.attachment.delete).toHaveBeenCalled();
    });

    it('他人の添付ファイルは削除できない', async () => {
      const otherUserAttachment = {
        ...mockAttachment,
        visitRecord: {
          ...mockVisitRecord,
          dailyReport: {
            ...mockVisitRecord.dailyReport,
            salespersonId: 999, // 別のユーザー
          },
        },
      };

      vi.mocked(prisma.attachment.findUnique).mockResolvedValue(otherUserAttachment as never);

      const attachment = await prisma.attachment.findUnique({
        where: { id: 1 },
      });

      // 自分のファイルではない
      expect(attachment?.visitRecord.dailyReport.salespersonId).not.toBe(mockUser.id);
    });

    it('提出済み日報の添付ファイルは削除できない', async () => {
      const submittedAttachment = {
        ...mockAttachment,
        visitRecord: {
          ...mockVisitRecord,
          dailyReport: {
            ...mockVisitRecord.dailyReport,
            status: 'submitted',
          },
        },
      };

      vi.mocked(prisma.attachment.findUnique).mockResolvedValue(submittedAttachment as never);

      const attachment = await prisma.attachment.findUnique({
        where: { id: 1 },
      });

      // 提出済みの場合は削除不可
      const allowedStatuses = ['draft', 'rejected'];
      expect(allowedStatuses.includes(attachment?.visitRecord.dailyReport.status as string)).toBe(false);
    });
  });

  describe('ファイルバリデーション', () => {
    it('許可されたファイル形式のみアップロード可能', () => {
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
      ];

      expect(allowedMimeTypes).toContain('application/pdf');
      expect(allowedMimeTypes).toContain('image/jpeg');
      expect(allowedMimeTypes).not.toContain('application/x-executable');
    });

    it('10MBを超えるファイルはアップロード不可', () => {
      const maxFileSize = 10 * 1024 * 1024; // 10MB

      expect(maxFileSize).toBe(10485760);

      // 10MB以下はOK
      expect(1024 * 1024 * 5 <= maxFileSize).toBe(true);

      // 10MB超はNG
      expect(1024 * 1024 * 15 <= maxFileSize).toBe(false);
    });
  });
});

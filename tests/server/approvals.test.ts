/**
 * 承認APIテスト
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/server/index';
import {
  mockPrisma,
  testStaffUser,
  testManagerUser,
  testDirectorUser,
  testSubmittedReport,
  testManagerApprovedReport,
  testDraftReport,
  getAuthHeader,
} from './setup';
import { verifyAccessToken } from '../../src/server/lib/jwt';

const mockedVerifyAccessToken = vi.mocked(verifyAccessToken);

describe('承認API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/v1/approvals', () => {
    it('課長が承認待ち一覧を取得できる', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      mockPrisma.dailyReport.findMany.mockResolvedValue([testSubmittedReport]);
      mockPrisma.dailyReport.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/approvals')
        .set(getAuthHeader());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.pagination.total_count).toBe(1);
    });

    it('部長が承認待ち一覧を取得できる', async () => {
      mockedVerifyAccessToken.mockReturnValue(testDirectorUser);
      mockPrisma.dailyReport.findMany.mockResolvedValue([
        testManagerApprovedReport,
      ]);
      mockPrisma.dailyReport.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/v1/approvals')
        .set(getAuthHeader());

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toHaveLength(1);
    });

    it('担当者は承認待ち一覧にアクセスできない（403）', async () => {
      mockedVerifyAccessToken.mockReturnValue(testStaffUser);

      const response = await request(app)
        .get('/api/v1/approvals')
        .set(getAuthHeader());

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('認証なしでアクセスすると401エラー', async () => {
      const response = await request(app).get('/api/v1/approvals');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('ページネーションが正しく動作する', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      mockPrisma.dailyReport.findMany.mockResolvedValue([]);
      mockPrisma.dailyReport.count.mockResolvedValue(50);

      const response = await request(app)
        .get('/api/v1/approvals?page=2&per_page=10')
        .set(getAuthHeader());

      expect(response.status).toBe(200);
      expect(response.body.data.pagination.current_page).toBe(2);
      expect(response.body.data.pagination.per_page).toBe(10);
      expect(response.body.data.pagination.total_pages).toBe(5);
    });
  });

  describe('POST /api/v1/reports/:id/approve', () => {
    it('課長が提出済み日報を承認できる', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(testSubmittedReport);
      mockPrisma.$transaction.mockResolvedValue([
        {
          ...testSubmittedReport,
          status: 'manager_approved',
          managerApprovedAt: new Date(),
        },
        {},
      ]);

      const response = await request(app)
        .post('/api/v1/reports/1/approve')
        .set(getAuthHeader())
        .send({ comment: '良い報告です' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('manager_approved');
    });

    it('部長が課長承認済み日報を承認できる', async () => {
      mockedVerifyAccessToken.mockReturnValue(testDirectorUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(
        testManagerApprovedReport
      );
      mockPrisma.$transaction.mockResolvedValue([
        {
          ...testManagerApprovedReport,
          status: 'approved',
          directorApprovedAt: new Date(),
        },
        {},
      ]);

      const response = await request(app)
        .post('/api/v1/reports/2/approve')
        .set(getAuthHeader())
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
    });

    it('担当者は承認できない（403）', async () => {
      mockedVerifyAccessToken.mockReturnValue(testStaffUser);

      const response = await request(app)
        .post('/api/v1/reports/1/approve')
        .set(getAuthHeader())
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('課長は課長承認済みの日報を承認できない（403）', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(
        testManagerApprovedReport
      );

      const response = await request(app)
        .post('/api/v1/reports/2/approve')
        .set(getAuthHeader())
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('部長は提出済みの日報を直接承認できない（403）', async () => {
      mockedVerifyAccessToken.mockReturnValue(testDirectorUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(testSubmittedReport);

      const response = await request(app)
        .post('/api/v1/reports/1/approve')
        .set(getAuthHeader())
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('他の課長の部下の日報は承認できない（403）', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      const reportWithDifferentManager = {
        ...testSubmittedReport,
        salesperson: {
          ...testSubmittedReport.salesperson,
          managerId: 999, // 別の課長
        },
      };
      mockPrisma.dailyReport.findUnique.mockResolvedValue(
        reportWithDifferentManager
      );

      const response = await request(app)
        .post('/api/v1/reports/1/approve')
        .set(getAuthHeader())
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('存在しない日報で404エラー', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/reports/999/approve')
        .set(getAuthHeader())
        .send({});

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('下書き状態の日報は承認できない（403）', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(testDraftReport);

      const response = await request(app)
        .post('/api/v1/reports/3/approve')
        .set(getAuthHeader())
        .send({});

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });
  });

  describe('POST /api/v1/reports/:id/reject', () => {
    it('課長が提出済み日報を差戻しできる', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(testSubmittedReport);
      mockPrisma.$transaction.mockResolvedValue([
        { ...testSubmittedReport, status: 'rejected' },
        {},
      ]);

      const response = await request(app)
        .post('/api/v1/reports/1/reject')
        .set(getAuthHeader())
        .send({ comment: '訪問内容をもう少し詳しく記載してください' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
    });

    it('部長が課長承認済み日報を差戻しできる', async () => {
      mockedVerifyAccessToken.mockReturnValue(testDirectorUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(
        testManagerApprovedReport
      );
      mockPrisma.$transaction.mockResolvedValue([
        { ...testManagerApprovedReport, status: 'rejected' },
        {},
      ]);

      const response = await request(app)
        .post('/api/v1/reports/2/reject')
        .set(getAuthHeader())
        .send({ comment: '再確認が必要です' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('rejected');
    });

    it('担当者は差戻しできない（403）', async () => {
      mockedVerifyAccessToken.mockReturnValue(testStaffUser);

      const response = await request(app)
        .post('/api/v1/reports/1/reject')
        .set(getAuthHeader())
        .send({ comment: '差戻し理由' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('差戻し理由なしで422エラー', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);

      const response = await request(app)
        .post('/api/v1/reports/1/reject')
        .set(getAuthHeader())
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('差戻し理由が空文字で422エラー', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);

      const response = await request(app)
        .post('/api/v1/reports/1/reject')
        .set(getAuthHeader())
        .send({ comment: '' });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('課長は課長承認済みの日報を差戻しできない（403）', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(
        testManagerApprovedReport
      );

      const response = await request(app)
        .post('/api/v1/reports/2/reject')
        .set(getAuthHeader())
        .send({ comment: '差戻し理由' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('部長は提出済みの日報を直接差戻しできない（403）', async () => {
      mockedVerifyAccessToken.mockReturnValue(testDirectorUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(testSubmittedReport);

      const response = await request(app)
        .post('/api/v1/reports/1/reject')
        .set(getAuthHeader())
        .send({ comment: '差戻し理由' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('存在しない日報で404エラー', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/reports/999/reject')
        .set(getAuthHeader())
        .send({ comment: '差戻し理由' });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('他の課長の部下の日報は差戻しできない（403）', async () => {
      mockedVerifyAccessToken.mockReturnValue(testManagerUser);
      const reportWithDifferentManager = {
        ...testSubmittedReport,
        salesperson: {
          ...testSubmittedReport.salesperson,
          managerId: 999,
        },
      };
      mockPrisma.dailyReport.findUnique.mockResolvedValue(
        reportWithDifferentManager
      );

      const response = await request(app)
        .post('/api/v1/reports/1/reject')
        .set(getAuthHeader())
        .send({ comment: '差戻し理由' });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
});

/**
 * 訪問記録APIテスト
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../src/server/index';
import {
  mockPrisma,
  testUser,
  testReport,
  testCustomer,
  testVisitRecord,
  getAuthHeader,
} from './setup';
import { verifyAccessToken } from '../../src/server/lib/jwt';

const mockedVerifyAccessToken = vi.mocked(verifyAccessToken);

describe('訪問記録API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトで認証成功
    mockedVerifyAccessToken.mockReturnValue(testUser);
  });

  describe('POST /api/v1/reports/:reportId/visits', () => {
    it('訪問記録を正常に追加できる', async () => {
      mockPrisma.dailyReport.findUnique.mockResolvedValue(testReport);
      mockPrisma.customer.findUnique.mockResolvedValue(testCustomer);
      mockPrisma.visitRecord.create.mockResolvedValue(testVisitRecord);

      const response = await request(app)
        .post('/api/v1/reports/1/visits')
        .set(getAuthHeader())
        .send({
          customer_id: 1,
          visit_time: '10:00',
          content: '新商品の提案を実施',
          result: 'negotiating',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.content).toBe('新商品の提案を実施');
    });

    it('認証なしでアクセスすると401エラー', async () => {
      const response = await request(app)
        .post('/api/v1/reports/1/visits')
        .send({
          customer_id: 1,
          content: '訪問内容',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('存在しない日報IDで404エラー', async () => {
      mockPrisma.dailyReport.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/reports/999/visits')
        .set(getAuthHeader())
        .send({
          customer_id: 1,
          content: '訪問内容',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('他人の日報には追加できない（403）', async () => {
      const otherUserReport = {
        ...testReport,
        salespersonId: 999,
      };
      mockPrisma.dailyReport.findUnique.mockResolvedValue(otherUserReport);

      const response = await request(app)
        .post('/api/v1/reports/1/visits')
        .set(getAuthHeader())
        .send({
          customer_id: 1,
          content: '訪問内容',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('提出済み日報には追加できない（403）', async () => {
      const submittedReport = {
        ...testReport,
        status: 'submitted',
      };
      mockPrisma.dailyReport.findUnique.mockResolvedValue(submittedReport);

      const response = await request(app)
        .post('/api/v1/reports/1/visits')
        .set(getAuthHeader())
        .send({
          customer_id: 1,
          content: '訪問内容',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('差戻し状態の日報には追加できる', async () => {
      const rejectedReport = {
        ...testReport,
        status: 'rejected',
      };
      mockPrisma.dailyReport.findUnique.mockResolvedValue(rejectedReport);
      mockPrisma.customer.findUnique.mockResolvedValue(testCustomer);
      mockPrisma.visitRecord.create.mockResolvedValue(testVisitRecord);

      const response = await request(app)
        .post('/api/v1/reports/1/visits')
        .set(getAuthHeader())
        .send({
          customer_id: 1,
          content: '訪問内容',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('無効な顧客IDで422エラー', async () => {
      mockPrisma.dailyReport.findUnique.mockResolvedValue(testReport);
      mockPrisma.customer.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/reports/1/visits')
        .set(getAuthHeader())
        .send({
          customer_id: 999,
          content: '訪問内容',
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('訪問内容が空の場合422エラー', async () => {
      const response = await request(app)
        .post('/api/v1/reports/1/visits')
        .set(getAuthHeader())
        .send({
          customer_id: 1,
          content: '',
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('不正な時刻形式で422エラー', async () => {
      const response = await request(app)
        .post('/api/v1/reports/1/visits')
        .set(getAuthHeader())
        .send({
          customer_id: 1,
          visit_time: '25:00',
          content: '訪問内容',
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/v1/reports/:reportId/visits/:visitId', () => {
    it('訪問記録を正常に更新できる', async () => {
      const visitWithReport = {
        ...testVisitRecord,
        dailyReport: testReport,
      };
      mockPrisma.visitRecord.findUnique.mockResolvedValue(visitWithReport);
      mockPrisma.visitRecord.update.mockResolvedValue({
        ...testVisitRecord,
        content: '更新後の訪問内容',
      });

      const response = await request(app)
        .put('/api/v1/reports/1/visits/1')
        .set(getAuthHeader())
        .send({
          content: '更新後の訪問内容',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.content).toBe('更新後の訪問内容');
    });

    it('存在しない訪問記録で404エラー', async () => {
      mockPrisma.visitRecord.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/v1/reports/1/visits/999')
        .set(getAuthHeader())
        .send({
          content: '更新内容',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('別の日報の訪問記録IDで404エラー', async () => {
      const visitWithDifferentReport = {
        ...testVisitRecord,
        dailyReportId: 999,
        dailyReport: { ...testReport, id: 999 },
      };
      mockPrisma.visitRecord.findUnique.mockResolvedValue(
        visitWithDifferentReport
      );

      const response = await request(app)
        .put('/api/v1/reports/1/visits/1')
        .set(getAuthHeader())
        .send({
          content: '更新内容',
        });

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('他人の日報は更新できない（403）', async () => {
      const visitWithOtherUserReport = {
        ...testVisitRecord,
        dailyReport: { ...testReport, salespersonId: 999 },
      };
      mockPrisma.visitRecord.findUnique.mockResolvedValue(
        visitWithOtherUserReport
      );

      const response = await request(app)
        .put('/api/v1/reports/1/visits/1')
        .set(getAuthHeader())
        .send({
          content: '更新内容',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('提出済み日報の訪問記録は更新できない（403）', async () => {
      const visitWithSubmittedReport = {
        ...testVisitRecord,
        dailyReport: { ...testReport, status: 'submitted' },
      };
      mockPrisma.visitRecord.findUnique.mockResolvedValue(
        visitWithSubmittedReport
      );

      const response = await request(app)
        .put('/api/v1/reports/1/visits/1')
        .set(getAuthHeader())
        .send({
          content: '更新内容',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('顧客IDを更新できる', async () => {
      const visitWithReport = {
        ...testVisitRecord,
        dailyReport: testReport,
      };
      const newCustomer = { ...testCustomer, id: 2, name: '株式会社XYZ' };

      mockPrisma.visitRecord.findUnique.mockResolvedValue(visitWithReport);
      mockPrisma.customer.findUnique.mockResolvedValue(newCustomer);
      mockPrisma.visitRecord.update.mockResolvedValue({
        ...testVisitRecord,
        customerId: 2,
        customer: { id: 2, name: '株式会社XYZ' },
      });

      const response = await request(app)
        .put('/api/v1/reports/1/visits/1')
        .set(getAuthHeader())
        .send({
          customer_id: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/v1/reports/:reportId/visits/:visitId', () => {
    it('訪問記録を正常に削除できる', async () => {
      const visitWithReport = {
        ...testVisitRecord,
        dailyReport: testReport,
      };
      mockPrisma.visitRecord.findUnique.mockResolvedValue(visitWithReport);
      mockPrisma.visitRecord.delete.mockResolvedValue(testVisitRecord);

      const response = await request(app)
        .delete('/api/v1/reports/1/visits/1')
        .set(getAuthHeader());

      expect(response.status).toBe(204);
    });

    it('存在しない訪問記録で404エラー', async () => {
      mockPrisma.visitRecord.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/v1/reports/1/visits/999')
        .set(getAuthHeader());

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });

    it('他人の日報の訪問記録は削除できない（403）', async () => {
      const visitWithOtherUserReport = {
        ...testVisitRecord,
        dailyReport: { ...testReport, salespersonId: 999 },
      };
      mockPrisma.visitRecord.findUnique.mockResolvedValue(
        visitWithOtherUserReport
      );

      const response = await request(app)
        .delete('/api/v1/reports/1/visits/1')
        .set(getAuthHeader());

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('提出済み日報の訪問記録は削除できない（403）', async () => {
      const visitWithSubmittedReport = {
        ...testVisitRecord,
        dailyReport: { ...testReport, status: 'approved' },
      };
      mockPrisma.visitRecord.findUnique.mockResolvedValue(
        visitWithSubmittedReport
      );

      const response = await request(app)
        .delete('/api/v1/reports/1/visits/1')
        .set(getAuthHeader());

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('INVALID_STATUS');
    });

    it('差戻し状態の日報の訪問記録は削除できる', async () => {
      const visitWithRejectedReport = {
        ...testVisitRecord,
        dailyReport: { ...testReport, status: 'rejected' },
      };
      mockPrisma.visitRecord.findUnique.mockResolvedValue(
        visitWithRejectedReport
      );
      mockPrisma.visitRecord.delete.mockResolvedValue(testVisitRecord);

      const response = await request(app)
        .delete('/api/v1/reports/1/visits/1')
        .set(getAuthHeader());

      expect(response.status).toBe(204);
    });
  });
});

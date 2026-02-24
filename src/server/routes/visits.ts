/**
 * 訪問記録API
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// 訪問記録作成スキーマ
const createVisitSchema = z.object({
  customer_id: z.number().int().positive('顧客を選択してください'),
  visit_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '時刻はHH:MM形式で入力してください')
    .optional()
    .nullable(),
  content: z
    .string()
    .min(1, '訪問内容を入力してください')
    .max(2000, '訪問内容は2000文字以内で入力してください'),
  result: z
    .enum([
      'negotiating',
      'closed_won',
      'closed_lost',
      'information_gathering',
      'other',
    ])
    .optional()
    .nullable(),
});

// 訪問記録更新スキーマ
const updateVisitSchema = z.object({
  customer_id: z.number().int().positive('顧客を選択してください').optional(),
  visit_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '時刻はHH:MM形式で入力してください')
    .optional()
    .nullable(),
  content: z
    .string()
    .min(1, '訪問内容を入力してください')
    .max(2000, '訪問内容は2000文字以内で入力してください')
    .optional(),
  result: z
    .enum([
      'negotiating',
      'closed_won',
      'closed_lost',
      'information_gathering',
      'other',
    ])
    .optional()
    .nullable(),
});

/**
 * 日報が編集可能かチェック
 */
function isReportEditable(status: string): boolean {
  return status === 'draft' || status === 'rejected';
}

/**
 * 時刻文字列をDate型に変換
 */
function parseVisitTime(timeStr: string | null | undefined): Date | null {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * POST /api/v1/reports/:reportId/visits
 * 訪問記録を追加
 */
router.post(
  '/reports/:reportId/visits',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reportId = parseInt(req.params.reportId, 10);

      if (isNaN(reportId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: '日報IDが不正です',
          },
        });
        return;
      }

      // 日報の存在確認と権限チェック
      const report = await prisma.dailyReport.findUnique({
        where: { id: reportId },
        include: { salesperson: true },
      });

      if (!report) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '日報が見つかりません',
          },
        });
        return;
      }

      // 自分の日報かチェック
      if (report.salespersonId !== req.user?.userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '権限がありません',
          },
        });
        return;
      }

      // 編集可能な状態かチェック
      if (!isReportEditable(report.status)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'この状態では操作できません',
          },
        });
        return;
      }

      // リクエストボディのバリデーション
      const parseResult = createVisitSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0].message,
          },
        });
        return;
      }

      const { customer_id, visit_time, content, result } = parseResult.data;

      // 顧客の存在確認
      const customer = await prisma.customer.findUnique({
        where: { id: customer_id },
      });

      if (!customer || !customer.isActive) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '有効な顧客を選択してください',
          },
        });
        return;
      }

      // 訪問記録を作成
      const visitRecord = await prisma.visitRecord.create({
        data: {
          dailyReportId: reportId,
          customerId: customer_id,
          visitTime: parseVisitTime(visit_time),
          content,
          result: result ?? null,
        },
        include: {
          customer: {
            select: { id: true, name: true },
          },
          attachments: true,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: visitRecord.id,
          daily_report_id: visitRecord.dailyReportId,
          customer: visitRecord.customer,
          visit_time: visit_time ?? null,
          content: visitRecord.content,
          result: visitRecord.result,
          attachments: visitRecord.attachments,
          created_at: visitRecord.createdAt,
          updated_at: visitRecord.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error creating visit record:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      });
    }
  }
);

/**
 * PUT /api/v1/reports/:reportId/visits/:visitId
 * 訪問記録を更新
 */
router.put(
  '/reports/:reportId/visits/:visitId',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reportId = parseInt(req.params.reportId, 10);
      const visitId = parseInt(req.params.visitId, 10);

      if (isNaN(reportId) || isNaN(visitId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'パラメータが不正です',
          },
        });
        return;
      }

      // 訪問記録の存在確認
      const existingVisit = await prisma.visitRecord.findUnique({
        where: { id: visitId },
        include: {
          dailyReport: {
            include: { salesperson: true },
          },
        },
      });

      if (!existingVisit || existingVisit.dailyReportId !== reportId) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '訪問記録が見つかりません',
          },
        });
        return;
      }

      // 自分の日報かチェック
      if (existingVisit.dailyReport.salespersonId !== req.user?.userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '権限がありません',
          },
        });
        return;
      }

      // 編集可能な状態かチェック
      if (!isReportEditable(existingVisit.dailyReport.status)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'この状態では操作できません',
          },
        });
        return;
      }

      // リクエストボディのバリデーション
      const parseResult = updateVisitSchema.safeParse(req.body);

      if (!parseResult.success) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0].message,
          },
        });
        return;
      }

      const { customer_id, visit_time, content, result } = parseResult.data;

      // 顧客が指定されている場合は存在確認
      if (customer_id !== undefined) {
        const customer = await prisma.customer.findUnique({
          where: { id: customer_id },
        });

        if (!customer || !customer.isActive) {
          res.status(422).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: '有効な顧客を選択してください',
            },
          });
          return;
        }
      }

      // 更新データを構築
      const updateData: {
        customerId?: number;
        visitTime?: Date | null;
        content?: string;
        result?: string | null;
      } = {};

      if (customer_id !== undefined) {
        updateData.customerId = customer_id;
      }
      if (visit_time !== undefined) {
        updateData.visitTime = parseVisitTime(visit_time);
      }
      if (content !== undefined) {
        updateData.content = content;
      }
      if (result !== undefined) {
        updateData.result = result;
      }

      // 訪問記録を更新
      const visitRecord = await prisma.visitRecord.update({
        where: { id: visitId },
        data: updateData,
        include: {
          customer: {
            select: { id: true, name: true },
          },
          attachments: true,
        },
      });

      // visit_timeをフォーマット
      let formattedVisitTime: string | null = null;
      if (visitRecord.visitTime) {
        const hours = visitRecord.visitTime
          .getHours()
          .toString()
          .padStart(2, '0');
        const minutes = visitRecord.visitTime
          .getMinutes()
          .toString()
          .padStart(2, '0');
        formattedVisitTime = `${hours}:${minutes}`;
      }

      res.status(200).json({
        success: true,
        data: {
          id: visitRecord.id,
          daily_report_id: visitRecord.dailyReportId,
          customer: visitRecord.customer,
          visit_time: formattedVisitTime,
          content: visitRecord.content,
          result: visitRecord.result,
          attachments: visitRecord.attachments,
          created_at: visitRecord.createdAt,
          updated_at: visitRecord.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error updating visit record:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      });
    }
  }
);

/**
 * DELETE /api/v1/reports/:reportId/visits/:visitId
 * 訪問記録を削除
 */
router.delete(
  '/reports/:reportId/visits/:visitId',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reportId = parseInt(req.params.reportId, 10);
      const visitId = parseInt(req.params.visitId, 10);

      if (isNaN(reportId) || isNaN(visitId)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'パラメータが不正です',
          },
        });
        return;
      }

      // 訪問記録の存在確認
      const existingVisit = await prisma.visitRecord.findUnique({
        where: { id: visitId },
        include: {
          dailyReport: {
            include: { salesperson: true },
          },
        },
      });

      if (!existingVisit || existingVisit.dailyReportId !== reportId) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '訪問記録が見つかりません',
          },
        });
        return;
      }

      // 自分の日報かチェック
      if (existingVisit.dailyReport.salespersonId !== req.user?.userId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '権限がありません',
          },
        });
        return;
      }

      // 編集可能な状態かチェック
      if (!isReportEditable(existingVisit.dailyReport.status)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'この状態では操作できません',
          },
        });
        return;
      }

      // 訪問記録を削除（関連する添付ファイルもカスケード削除される）
      await prisma.visitRecord.delete({
        where: { id: visitId },
      });

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting visit record:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'サーバーエラーが発生しました',
        },
      });
    }
  }
);

export default router;

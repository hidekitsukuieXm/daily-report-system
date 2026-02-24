/**
 * 承認API
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// 役職レベル定数
const POSITION_LEVEL = {
  STAFF: 1, // 担当
  MANAGER: 2, // 課長
  DIRECTOR: 3, // 部長
} as const;

// 承認リクエストスキーマ
const approveRequestSchema = z.object({
  comment: z.string().max(2000).optional(),
});

// 差戻しリクエストスキーマ
const rejectRequestSchema = z.object({
  comment: z
    .string()
    .min(1, '差戻し理由を入力してください')
    .max(2000, '差戻し理由は2000文字以内で入力してください'),
});

// ページネーションスキーマ
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/v1/approvals
 * 承認待ち一覧取得
 */
router.get(
  '/approvals',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      const positionLevel = user.positionLevel;

      // 担当者は承認待ち一覧にアクセスできない
      if (positionLevel < POSITION_LEVEL.MANAGER) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '権限がありません',
          },
        });
        return;
      }

      // ページネーションパラメータ
      const parseResult = paginationSchema.safeParse(req.query);
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

      const { page, per_page } = parseResult.data;
      const skip = (page - 1) * per_page;

      // 承認待ちステータスを決定
      // 課長: submitted状態の日報（部下の日報のみ）
      // 部長: manager_approved状態の日報
      let statusFilter: string;
      let additionalFilter = {};

      if (positionLevel === POSITION_LEVEL.MANAGER) {
        statusFilter = 'submitted';
        // 課長は自分の部下の日報のみ
        additionalFilter = {
          salesperson: {
            managerId: user.userId,
          },
        };
      } else {
        // 部長
        statusFilter = 'manager_approved';
      }

      // 承認待ち日報を取得
      const [reports, totalCount] = await Promise.all([
        prisma.dailyReport.findMany({
          where: {
            status: statusFilter,
            ...additionalFilter,
          },
          include: {
            salesperson: {
              select: {
                id: true,
                name: true,
              },
            },
            _count: {
              select: {
                visitRecords: true,
              },
            },
          },
          orderBy: {
            submittedAt: 'asc',
          },
          skip,
          take: per_page,
        }),
        prisma.dailyReport.count({
          where: {
            status: statusFilter,
            ...additionalFilter,
          },
        }),
      ]);

      const totalPages = Math.ceil(totalCount / per_page);

      res.status(200).json({
        success: true,
        data: {
          items: reports.map((report) => ({
            id: report.id,
            report_date: report.reportDate,
            salesperson: report.salesperson,
            status: report.status,
            submitted_at: report.submittedAt,
            visit_count: report._count.visitRecords,
            created_at: report.createdAt,
            updated_at: report.updatedAt,
          })),
          pagination: {
            current_page: page,
            per_page,
            total_pages: totalPages,
            total_count: totalCount,
          },
        },
      });
    } catch (error) {
      console.error('Error fetching approvals:', error);
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
 * POST /api/v1/reports/:id/approve
 * 日報承認
 */
router.post(
  '/reports/:id/approve',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reportId = parseInt(req.params.id, 10);

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

      const user = req.user!;
      const positionLevel = user.positionLevel;

      // 担当者は承認できない
      if (positionLevel < POSITION_LEVEL.MANAGER) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '権限がありません',
          },
        });
        return;
      }

      // リクエストボディのバリデーション
      const parseResult = approveRequestSchema.safeParse(req.body);
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

      const { comment } = parseResult.data;

      // 日報を取得
      const report = await prisma.dailyReport.findUnique({
        where: { id: reportId },
        include: {
          salesperson: true,
        },
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

      // 権限とステータスのチェック
      let newStatus: string;
      let approvalLevel: string;

      if (positionLevel === POSITION_LEVEL.MANAGER) {
        // 課長: submitted → manager_approved
        if (report.status !== 'submitted') {
          res.status(403).json({
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: 'この状態では承認できません',
            },
          });
          return;
        }

        // 自分の部下かチェック
        if (report.salesperson.managerId !== user.userId) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: '権限がありません',
            },
          });
          return;
        }

        newStatus = 'manager_approved';
        approvalLevel = 'manager';
      } else {
        // 部長: manager_approved → approved
        if (report.status !== 'manager_approved') {
          res.status(403).json({
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: 'この状態では承認できません',
            },
          });
          return;
        }

        newStatus = 'approved';
        approvalLevel = 'director';
      }

      // トランザクションで日報更新と承認履歴作成
      const now = new Date();
      const updateData: Record<string, unknown> = {
        status: newStatus,
      };

      if (approvalLevel === 'manager') {
        updateData.managerApprovedAt = now;
      } else {
        updateData.directorApprovedAt = now;
      }

      const [updatedReport] = await prisma.$transaction([
        prisma.dailyReport.update({
          where: { id: reportId },
          data: updateData,
        }),
        prisma.approvalHistory.create({
          data: {
            dailyReportId: reportId,
            approverId: user.userId,
            action: 'approved',
            comment: comment ?? null,
            approvalLevel: approvalLevel,
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          id: updatedReport.id,
          status: updatedReport.status,
          manager_approved_at: updatedReport.managerApprovedAt,
          director_approved_at: updatedReport.directorApprovedAt,
        },
      });
    } catch (error) {
      console.error('Error approving report:', error);
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
 * POST /api/v1/reports/:id/reject
 * 日報差戻し
 */
router.post(
  '/reports/:id/reject',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const reportId = parseInt(req.params.id, 10);

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

      const user = req.user!;
      const positionLevel = user.positionLevel;

      // 担当者は差戻しできない
      if (positionLevel < POSITION_LEVEL.MANAGER) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: '権限がありません',
          },
        });
        return;
      }

      // リクエストボディのバリデーション
      const parseResult = rejectRequestSchema.safeParse(req.body);
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

      const { comment } = parseResult.data;

      // 日報を取得
      const report = await prisma.dailyReport.findUnique({
        where: { id: reportId },
        include: {
          salesperson: true,
        },
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

      // 権限とステータスのチェック
      let approvalLevel: string;

      if (positionLevel === POSITION_LEVEL.MANAGER) {
        // 課長: submitted状態のみ差戻し可能
        if (report.status !== 'submitted') {
          res.status(403).json({
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: 'この状態では差戻しできません',
            },
          });
          return;
        }

        // 自分の部下かチェック
        if (report.salesperson.managerId !== user.userId) {
          res.status(403).json({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: '権限がありません',
            },
          });
          return;
        }

        approvalLevel = 'manager';
      } else {
        // 部長: manager_approved状態のみ差戻し可能
        if (report.status !== 'manager_approved') {
          res.status(403).json({
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: 'この状態では差戻しできません',
            },
          });
          return;
        }

        approvalLevel = 'director';
      }

      // トランザクションで日報更新と承認履歴作成
      const [updatedReport] = await prisma.$transaction([
        prisma.dailyReport.update({
          where: { id: reportId },
          data: {
            status: 'rejected',
          },
        }),
        prisma.approvalHistory.create({
          data: {
            dailyReportId: reportId,
            approverId: user.userId,
            action: 'rejected',
            comment,
            approvalLevel,
          },
        }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          id: updatedReport.id,
          status: updatedReport.status,
        },
      });
    } catch (error) {
      console.error('Error rejecting report:', error);
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

/**
 * 日報 CRUD API ルート
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import {
  NotFoundError,
  ForbiddenError,
  InvalidStatusError,
  ConflictError,
} from '../lib/errors';
import {
  reportSearchQuerySchema,
  createReportRequestSchema,
  updateReportRequestSchema,
  idParamSchema,
} from '../../src/schemas/api';
import type { Prisma, ReportStatus } from '@prisma/client';

const router = Router();

/**
 * GET /api/v1/reports
 * 日報一覧取得（ページネーション、フィルタ対応）
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const query = reportSearchQuerySchema.parse(req.query);

    const {
      page,
      per_page,
      sort,
      order,
      date_from,
      date_to,
      salesperson_id,
      status,
    } = query;

    // 検索条件の構築
    const where: Prisma.DailyReportWhereInput = {};

    // 担当者（level=1）は自分の日報のみ閲覧可能
    // 課長（level=2）は部下の日報も閲覧可能
    // 部長（level=3）は全員の日報を閲覧可能
    if (user.positionLevel === 1) {
      where.salespersonId = user.id;
    } else if (user.positionLevel === 2) {
      // 課長は自分の部下の日報を閲覧可能
      where.OR = [
        { salespersonId: user.id },
        { salesperson: { managerId: user.id } },
      ];
    }
    // 部長（level=3）は制限なし

    // 日付範囲フィルタ
    if (date_from || date_to) {
      where.reportDate = {};
      if (date_from) {
        where.reportDate.gte = new Date(date_from);
      }
      if (date_to) {
        where.reportDate.lte = new Date(date_to);
      }
    }

    // 担当者フィルタ（上長のみ使用可能）
    if (salesperson_id && user.positionLevel >= 2) {
      where.salespersonId = salesperson_id;
    }

    // ステータスフィルタ
    if (status) {
      where.status = status as ReportStatus;
    }

    // ソート条件の構築
    const orderBy: Prisma.DailyReportOrderByWithRelationInput = {};
    if (sort === 'report_date' || sort === 'created_at' || sort === 'updated_at') {
      const sortKey = sort === 'report_date' ? 'reportDate' : sort === 'created_at' ? 'createdAt' : 'updatedAt';
      orderBy[sortKey] = order;
    } else {
      orderBy.reportDate = 'desc';
    }

    // 総件数取得
    const totalCount = await prisma.dailyReport.count({ where });

    // 日報一覧取得
    const reports = await prisma.dailyReport.findMany({
      where,
      orderBy,
      skip: (page - 1) * per_page,
      take: per_page,
      include: {
        salesperson: {
          select: { id: true, name: true },
        },
        _count: {
          select: { visitRecords: true },
        },
      },
    });

    const totalPages = Math.ceil(totalCount / per_page);

    res.json({
      success: true,
      data: {
        items: reports.map((report) => ({
          id: report.id,
          reportDate: report.reportDate,
          status: report.status,
          submittedAt: report.submittedAt,
          createdAt: report.createdAt,
          updatedAt: report.updatedAt,
          salesperson: report.salesperson,
          visitCount: report._count.visitRecords,
        })),
        pagination: {
          currentPage: page,
          perPage: per_page,
          totalPages,
          totalCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/reports/:id
 * 日報詳細取得
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = idParamSchema.parse(req.params);

    const report = await prisma.dailyReport.findUnique({
      where: { id },
      include: {
        salesperson: {
          include: { position: true },
        },
        visitRecords: {
          include: {
            customer: { select: { id: true, name: true } },
            attachments: true,
          },
        },
        approvalHistories: {
          include: {
            approver: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        comments: {
          include: {
            commenter: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!report) {
      throw new NotFoundError('日報が見つかりません');
    }

    // 権限チェック
    const canView = checkViewPermission(user, report);
    if (!canView) {
      throw new ForbiddenError('この日報を閲覧する権限がありません');
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/reports
 * 日報新規作成
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const data = createReportRequestSchema.parse(req.body);

    // 同一日の日報が既に存在するかチェック
    const existingReport = await prisma.dailyReport.findUnique({
      where: {
        salespersonId_reportDate: {
          salespersonId: user.id,
          reportDate: new Date(data.report_date),
        },
      },
    });

    if (existingReport) {
      throw new ConflictError('DUPLICATE_REPORT', 'この日付の日報は既に存在します');
    }

    // 日報を作成（トランザクション）
    const report = await prisma.$transaction(async (tx) => {
      // 日報本体を作成
      const newReport = await tx.dailyReport.create({
        data: {
          salespersonId: user.id,
          reportDate: new Date(data.report_date),
          problem: data.problem ?? null,
          plan: data.plan ?? null,
          status: 'draft',
        },
      });

      // 訪問記録を作成
      if (data.visits && data.visits.length > 0) {
        await tx.visitRecord.createMany({
          data: data.visits.map((visit) => ({
            dailyReportId: newReport.id,
            customerId: visit.customer_id,
            visitTime: visit.visit_time ? parseTime(visit.visit_time) : null,
            content: visit.content,
            result: visit.result ?? null,
          })),
        });
      }

      return tx.dailyReport.findUnique({
        where: { id: newReport.id },
        include: {
          visitRecords: {
            include: {
              customer: { select: { id: true, name: true } },
            },
          },
        },
      });
    });

    res.status(201).json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/v1/reports/:id
 * 日報更新
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = idParamSchema.parse(req.params);
    const data = updateReportRequestSchema.parse(req.body);

    const report = await prisma.dailyReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError('日報が見つかりません');
    }

    // 自分の日報のみ更新可能
    if (report.salespersonId !== user.id) {
      throw new ForbiddenError('この日報を編集する権限がありません');
    }

    // 下書きまたは差戻し状態のみ更新可能
    if (report.status !== 'draft' && report.status !== 'rejected') {
      throw new InvalidStatusError('下書きまたは差戻し状態の日報のみ編集できます');
    }

    const updatedReport = await prisma.dailyReport.update({
      where: { id },
      data: {
        problem: data.problem ?? report.problem,
        plan: data.plan ?? report.plan,
        // 差戻し状態の場合は下書きに戻す
        status: report.status === 'rejected' ? 'draft' : report.status,
      },
      include: {
        visitRecords: {
          include: {
            customer: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedReport,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/v1/reports/:id
 * 日報削除
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user!;
    const { id } = idParamSchema.parse(req.params);

    const report = await prisma.dailyReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundError('日報が見つかりません');
    }

    // 自分の日報のみ削除可能
    if (report.salespersonId !== user.id) {
      throw new ForbiddenError('この日報を削除する権限がありません');
    }

    // 下書き状態のみ削除可能
    if (report.status !== 'draft') {
      throw new InvalidStatusError('下書き状態の日報のみ削除できます');
    }

    await prisma.dailyReport.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * 閲覧権限チェック
 */
function checkViewPermission(
  user: { id: number; positionLevel: number },
  report: { salespersonId: number; salesperson?: { managerId: number | null; directorId: number | null } }
): boolean {
  // 自分の日報は閲覧可能
  if (report.salespersonId === user.id) {
    return true;
  }

  // 部長（level=3）は全員の日報を閲覧可能
  if (user.positionLevel >= 3) {
    return true;
  }

  // 課長（level=2）は部下の日報を閲覧可能
  if (user.positionLevel === 2 && report.salesperson?.managerId === user.id) {
    return true;
  }

  return false;
}

/**
 * 時刻文字列をDate型に変換（PostgreSQLのTIME型用）
 */
function parseTime(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export default router;

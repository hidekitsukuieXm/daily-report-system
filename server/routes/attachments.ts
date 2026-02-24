/**
 * 添付ファイル API ルート
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../lib/errors';
import { upload } from '../lib/upload';
import { idParamSchema } from '../../src/schemas/api';

const router = Router();

// アップロードディレクトリ
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';

/**
 * POST /api/v1/visits/:visitId/attachments
 * ファイルアップロード
 */
router.post(
  '/visits/:visitId/attachments',
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const visitId = parseInt(req.params.visitId, 10);

      if (isNaN(visitId) || visitId <= 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '無効な訪問記録IDです' },
        });
        return;
      }

      // 訪問記録の存在確認と権限チェック
      const visitRecord = await prisma.visitRecord.findUnique({
        where: { id: visitId },
        include: {
          dailyReport: {
            include: {
              salesperson: true,
            },
          },
        },
      });

      if (!visitRecord) {
        throw new NotFoundError('訪問記録が見つかりません');
      }

      // 自分の日報の訪問記録のみ添付可能
      if (visitRecord.dailyReport.salespersonId !== user.id) {
        throw new ForbiddenError('この訪問記録にファイルを添付する権限がありません');
      }

      // 下書きまたは差戻し状態のみ添付可能
      const allowedStatuses = ['draft', 'rejected'];
      if (!allowedStatuses.includes(visitRecord.dailyReport.status)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: '下書きまたは差戻し状態の日報のみファイルを添付できます',
          },
        });
        return;
      }

      // ファイルがアップロードされているか確認
      if (!req.file) {
        // ファイル形式のエラーをチェック
        res.status(415).json({
          success: false,
          error: {
            code: 'UNSUPPORTED_FILE_TYPE',
            message: 'サポートされていないファイル形式です',
          },
        });
        return;
      }

      // 添付ファイル情報をDBに保存
      const attachment = await prisma.attachment.create({
        data: {
          visitRecordId: visitId,
          fileName: req.file.originalname,
          filePath: req.file.filename,
          contentType: req.file.mimetype,
          fileSize: req.file.size,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          id: attachment.id,
          file_name: attachment.fileName,
          file_size: attachment.fileSize,
          content_type: attachment.contentType,
          download_url: `/api/v1/attachments/${attachment.id}`,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/attachments/:id
 * ファイルダウンロード
 */
router.get(
  '/attachments/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);

      const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: {
          visitRecord: {
            include: {
              dailyReport: {
                include: {
                  salesperson: true,
                },
              },
            },
          },
        },
      });

      if (!attachment) {
        throw new NotFoundError('添付ファイルが見つかりません');
      }

      // 閲覧権限チェック
      const report = attachment.visitRecord.dailyReport;
      const canView = checkViewPermission(user, report);

      if (!canView) {
        throw new ForbiddenError('このファイルをダウンロードする権限がありません');
      }

      // ファイルパスの構築
      const filePath = path.join(UPLOAD_DIR, attachment.filePath);

      // ファイルの存在確認
      try {
        await fs.access(filePath);
      } catch {
        throw new NotFoundError('ファイルが見つかりません');
      }

      // ファイルダウンロード
      res.setHeader('Content-Type', attachment.contentType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`
      );
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/v1/attachments/:id
 * ファイル削除
 */
router.delete(
  '/attachments/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user!;
      const { id } = idParamSchema.parse(req.params);

      const attachment = await prisma.attachment.findUnique({
        where: { id },
        include: {
          visitRecord: {
            include: {
              dailyReport: true,
            },
          },
        },
      });

      if (!attachment) {
        throw new NotFoundError('添付ファイルが見つかりません');
      }

      // 自分の日報の添付ファイルのみ削除可能
      if (attachment.visitRecord.dailyReport.salespersonId !== user.id) {
        throw new ForbiddenError('このファイルを削除する権限がありません');
      }

      // 下書きまたは差戻し状態のみ削除可能
      const allowedStatuses = ['draft', 'rejected'];
      if (!allowedStatuses.includes(attachment.visitRecord.dailyReport.status)) {
        res.status(403).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: '下書きまたは差戻し状態の日報のファイルのみ削除できます',
          },
        });
        return;
      }

      // ファイルの物理削除
      const filePath = path.join(UPLOAD_DIR, attachment.filePath);
      try {
        await fs.unlink(filePath);
      } catch {
        // ファイルが存在しない場合は無視（DB上のレコードは削除する）
        console.warn(`File not found: ${filePath}`);
      }

      // DBから削除
      await prisma.attachment.delete({
        where: { id },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

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

export default router;

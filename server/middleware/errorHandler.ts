/**
 * エラーハンドリングミドルウェア
 */

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // AppError（カスタムエラー）
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Zodバリデーションエラー
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => e.message).join(', ');
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: messages,
      },
    });
    return;
  }

  // Prismaエラー
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': // Unique constraint failed
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_ENTRY',
            message: '既に登録されています',
          },
        });
        return;
      case 'P2025': // Record not found
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'リソースが見つかりません',
          },
        });
        return;
      default:
        break;
    }
  }

  // その他のエラー
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'サーバーエラーが発生しました',
    },
  });
}

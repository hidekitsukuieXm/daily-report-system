/**
 * 認証ミドルウェア
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UnauthorizedError } from '../lib/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  positionId: number;
  positionLevel: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('認証が必要です');
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };

      const user = await prisma.salesperson.findUnique({
        where: { id: decoded.userId },
        include: { position: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('アカウントが無効です');
      }

      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        positionId: user.positionId,
        positionLevel: user.position.level,
      };

      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('トークンの有効期限が切れています');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('トークンが無効です');
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * 開発・テスト用の簡易認証ミドルウェア
 * 実際のプロダクション環境ではJWT認証を使用
 */
export async function devAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // X-User-Id ヘッダーでユーザーを指定可能（開発用）
    const userIdHeader = req.headers['x-user-id'];
    const userId = userIdHeader ? parseInt(userIdHeader as string, 10) : 1;

    const user = await prisma.salesperson.findUnique({
      where: { id: userId },
      include: { position: true },
    });

    if (!user) {
      throw new UnauthorizedError('ユーザーが見つかりません');
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      positionId: user.positionId,
      positionLevel: user.position.level,
    };

    next();
  } catch (error) {
    next(error);
  }
}

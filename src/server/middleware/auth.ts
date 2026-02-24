/**
 * Authentication Middleware
 * 認証ミドルウェア - JWTトークンの検証とユーザー情報の取得
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type DecodedToken } from '../lib/jwt';

export type AuthenticatedRequest = Request & {
  user?: DecodedToken;
};

/**
 * 認証ミドルウェア
 * Authorizationヘッダーからトークンを検証し、ユーザー情報をリクエストに付加
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '認証が必要です',
      },
    });
    return;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'トークンの形式が不正です',
      },
    });
    return;
  }

  const token = parts[1]!;
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'トークンが無効です',
      },
    });
    return;
  }

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp && decoded.exp < now) {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'トークンの有効期限が切れています',
      },
    });
    return;
  }

  req.user = decoded;
  next();
}

/**
 * 権限チェックミドルウェア
 * 指定されたレベル以上の権限を持つユーザーのみアクセスを許可
 */
export function requireLevel(minLevel: number) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です',
        },
      });
      return;
    }

    if (req.user.positionLevel < minLevel) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '権限がありません',
        },
      });
      return;
    }

    next();
  };
}

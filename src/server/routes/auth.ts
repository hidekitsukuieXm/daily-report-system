/**
 * Authentication Routes
 * 認証関連のAPIエンドポイント
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { verifyPassword, hashPassword } from '../../lib/auth/password';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpiresIn,
  type TokenPayload,
} from '../lib/jwt';
import {
  authenticate,
  type AuthenticatedRequest,
} from '../middleware/auth';
import {
  loginRequestSchema,
  refreshTokenRequestSchema,
} from '../../schemas/api';

const router = Router();

/**
 * POST /api/v1/auth/login
 * ログイン認証
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const parseResult = loginRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parseResult.error.errors[0]?.message || '入力値が不正です',
        },
      });
      return;
    }

    const { email, password, remember } = parseResult.data;

    // Find user by email
    const salesperson = await prisma.salesperson.findUnique({
      where: { email },
      include: {
        position: true,
      },
    });

    if (!salesperson) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      });
      return;
    }

    // Check if account is active
    if (!salesperson.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'アカウントが無効です。管理者にお問い合わせください',
        },
      });
      return;
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, salesperson.password);
    if (!isValidPassword) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      });
      return;
    }

    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: salesperson.id,
      email: salesperson.email,
      positionLevel: salesperson.position.level,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload, remember);

    // Set refresh token in HTTP-only cookie
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: remember ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000, // 30 days or 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: 'Bearer',
        expires_in: getAccessTokenExpiresIn(),
        user: {
          id: salesperson.id,
          name: salesperson.name,
          email: salesperson.email,
          position: {
            id: salesperson.position.id,
            name: salesperson.position.name,
            level: salesperson.position.level,
          },
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * ログアウト
 */
router.post(
  '/logout',
  authenticate,
  async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Clear refresh token cookie
      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'ログアウトしました',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
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
 * POST /api/v1/auth/refresh
 * トークンリフレッシュ
 */
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get refresh token from cookie or request body
    const refreshTokenFromCookie = req.cookies?.refresh_token;
    const parseResult = refreshTokenRequestSchema.safeParse(req.body);
    const refreshTokenFromBody = parseResult.success
      ? parseResult.data.refresh_token
      : null;

    const refreshToken = refreshTokenFromCookie || refreshTokenFromBody;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'リフレッシュトークンがありません',
        },
      });
      return;
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'リフレッシュトークンが無効です',
        },
      });
      return;
    }

    // Get fresh user data
    const salesperson = await prisma.salesperson.findUnique({
      where: { id: decoded.userId },
      include: {
        position: true,
      },
    });

    if (!salesperson || !salesperson.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: 'ACCOUNT_DISABLED',
          message: 'アカウントが無効です',
        },
      });
      return;
    }

    // Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: salesperson.id,
      email: salesperson.email,
      positionLevel: salesperson.position.level,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload);

    // Update refresh token cookie
    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        expires_in: getAccessTokenExpiresIn(),
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

/**
 * GET /api/v1/auth/me
 * ログインユーザー情報取得
 */
router.get(
  '/me',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
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

      const salesperson = await prisma.salesperson.findUnique({
        where: { id: req.user.userId },
        include: {
          position: true,
        },
      });

      if (!salesperson) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ユーザーが見つかりません',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          id: salesperson.id,
          name: salesperson.name,
          email: salesperson.email,
          position: {
            id: salesperson.position.id,
            name: salesperson.position.name,
            level: salesperson.position.level,
          },
        },
      });
    } catch (error) {
      console.error('Get me error:', error);
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

// Password change schema
const changePasswordSchema = z.object({
  current_password: z.string().min(1, '現在のパスワードを入力してください'),
  new_password: z
    .string()
    .min(8, '新しいパスワードは8文字以上で入力してください')
    .max(100),
});

/**
 * PUT /api/v1/auth/password
 * パスワード変更
 */
router.put(
  '/password',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
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

      // Validate request body
      const parseResult = changePasswordSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: parseResult.error.errors[0]?.message || '入力値が不正です',
          },
        });
        return;
      }

      const { current_password, new_password } = parseResult.data;

      // Get current user
      const salesperson = await prisma.salesperson.findUnique({
        where: { id: req.user.userId },
      });

      if (!salesperson) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'ユーザーが見つかりません',
          },
        });
        return;
      }

      // Verify current password
      const isValidPassword = await verifyPassword(
        current_password,
        salesperson.password
      );
      if (!isValidPassword) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: '現在のパスワードが正しくありません',
          },
        });
        return;
      }

      // Hash new password
      const hashedPassword = await hashPassword(new_password);

      // Update password
      await prisma.salesperson.update({
        where: { id: req.user.userId },
        data: { password: hashedPassword },
      });

      res.status(200).json({
        success: true,
        data: {
          message: 'パスワードを変更しました',
        },
      });
    } catch (error) {
      console.error('Change password error:', error);
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

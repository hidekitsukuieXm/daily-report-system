/**
 * 認証ミドルウェア
 * JWTトークンの検証とユーザー情報のリクエストへの付与
 */

import { NextRequest, NextResponse } from 'next/server';
import { decodeToken, isTokenExpired, type TokenPayload } from '@/lib/auth/jwt';

/** 認証済みリクエストに付与されるユーザー情報 */
export type AuthenticatedUser = {
  userId: number;
  email: string;
  positionLevel: number;
};

/** 認証エラーレスポンス */
type AuthErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

/** 認証エラーコード */
export const AuthErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

/**
 * 認証エラーレスポンスを生成
 */
function createAuthErrorResponse(
  code: AuthErrorCode,
  message: string
): NextResponse<AuthErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status: 401 }
  );
}

/**
 * Authorizationヘッダーからトークンを抽出
 */
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1] || null;
}

/**
 * トークンを検証してペイロードを取得
 */
export function verifyToken(token: string): {
  valid: boolean;
  payload: TokenPayload | null;
  error?: AuthErrorCode;
} {
  const payload = decodeToken(token);

  if (!payload) {
    return { valid: false, payload: null, error: AuthErrorCode.INVALID_TOKEN };
  }

  if (isTokenExpired(token)) {
    return { valid: false, payload: null, error: AuthErrorCode.TOKEN_EXPIRED };
  }

  return { valid: true, payload };
}

/**
 * 認証ミドルウェア
 * リクエストからJWTトークンを検証し、ユーザー情報を返す
 */
export function authMiddleware(request: NextRequest):
  | { success: true; user: AuthenticatedUser }
  | { success: false; response: NextResponse<AuthErrorResponse> } {
  const token = extractBearerToken(request);

  if (!token) {
    return {
      success: false,
      response: createAuthErrorResponse(
        AuthErrorCode.UNAUTHORIZED,
        '認証が必要です'
      ),
    };
  }

  const { valid, payload, error } = verifyToken(token);

  if (!valid || !payload) {
    const errorMessages: Record<AuthErrorCode, string> = {
      [AuthErrorCode.UNAUTHORIZED]: '認証が必要です',
      [AuthErrorCode.INVALID_TOKEN]: 'トークンが無効です',
      [AuthErrorCode.TOKEN_EXPIRED]: 'トークンの有効期限が切れています',
    };

    return {
      success: false,
      response: createAuthErrorResponse(
        error || AuthErrorCode.INVALID_TOKEN,
        errorMessages[error || AuthErrorCode.INVALID_TOKEN]
      ),
    };
  }

  return {
    success: true,
    user: {
      userId: payload.userId,
      email: payload.email,
      positionLevel: payload.positionLevel,
    },
  };
}

/**
 * 役職レベルによる権限チェック
 * @param user 認証済みユーザー
 * @param requiredLevel 必要な役職レベル（1: 担当, 2: 課長, 3: 部長）
 */
export function checkPositionLevel(
  user: AuthenticatedUser,
  requiredLevel: number
): boolean {
  return user.positionLevel >= requiredLevel;
}

/**
 * 権限エラーレスポンスを生成
 */
export function createForbiddenResponse(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '権限がありません',
      },
    },
    { status: 403 }
  );
}

/**
 * Server-side JWT Utilities
 * JWTトークンの生成と検証を行うサーバー用ユーティリティ
 */

import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || 'access-token-secret-key';
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || 'refresh-token-secret-key';
const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';
const REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN = '30d';

export type TokenPayload = {
  userId: number;
  email: string;
  positionLevel: number;
};

export type DecodedToken = TokenPayload & {
  exp: number;
  iat: number;
};

/**
 * アクセストークンを生成
 */
export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

/**
 * リフレッシュトークンを生成
 */
export function generateRefreshToken(
  payload: TokenPayload,
  rememberMe: boolean = false
): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: rememberMe
      ? REMEMBER_ME_REFRESH_TOKEN_EXPIRES_IN
      : REFRESH_TOKEN_EXPIRES_IN,
  });
}

/**
 * アクセストークンを検証
 */
export function verifyAccessToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * リフレッシュトークンを検証
 */
export function verifyRefreshToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * トークンの有効期限を秒数で取得
 */
export function getAccessTokenExpiresIn(): number {
  return 3600; // 1 hour in seconds
}

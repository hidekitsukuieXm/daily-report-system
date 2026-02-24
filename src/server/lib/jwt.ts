/**
 * JWTトークン生成・検証ユーティリティ
 */
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  email: string;
  positionLevel: number;
}

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? 'test-access-token-secret';
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET ?? 'test-refresh-token-secret';

const ACCESS_TOKEN_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/**
 * アクセストークンを生成
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

/**
 * リフレッシュトークンを生成
 */
export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });
}

/**
 * アクセストークンを検証
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_TOKEN_SECRET) as JwtPayload;
}

/**
 * リフレッシュトークンを検証
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_TOKEN_SECRET) as JwtPayload;
}

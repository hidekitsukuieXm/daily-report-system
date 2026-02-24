/**
 * JWT Token Utilities
 * JWTトークンのデコードと検証を行うユーティリティ
 *
 * 注意: トークンの生成はバックエンドで行います。
 * フロントエンドではトークンのデコードと有効期限チェックのみ行います。
 */

import type { Position, SalespersonWithPosition } from '@/schemas/data';

export type TokenPayload = {
  userId: number;
  email: string;
  positionLevel: number;
  exp?: number;
  iat?: number;
};

export type UserInfo = {
  id: number;
  name: string;
  email: string;
  position: Position;
};

/**
 * Base64URLデコード
 */
function base64UrlDecode(str: string): string {
  // Base64URL to Base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // パディングを追加
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }

  return atob(base64);
}

/**
 * トークンをデコード（検証なし）
 * 注意: これはフロントエンド用のデコードのみです。
 * 実際の検証はバックエンドで行ってください。
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    if (!payload) {
      return null;
    }

    const decoded = base64UrlDecode(payload);
    return JSON.parse(decoded) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * トークンの有効期限を取得（秒）
 */
export function getTokenExpiration(token: string): number | null {
  const decoded = decodeToken(token);
  return decoded?.exp ?? null;
}

/**
 * トークンが期限切れかどうかを確認
 */
export function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiration(token);
  if (!exp) {
    return true;
  }
  // 5秒の余裕を持たせる
  return Date.now() >= (exp - 5) * 1000;
}

/**
 * SalespersonからUserInfoを生成
 */
export function toUserInfo(salesperson: SalespersonWithPosition): UserInfo {
  return {
    id: salesperson.id,
    name: salesperson.name,
    email: salesperson.email,
    position: salesperson.position,
  };
}

/**
 * 認証ガードコンポーネント
 * 認証が必要なルートを保護する
 */

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/stores/auth';

type AuthGuardProps = {
  children: ReactNode;
  requiredLevel?: number; // 必要な役職レベル（オプション）
};

/**
 * 認証ガード
 * 未認証ユーザーをログイン画面にリダイレクト
 */
export function AuthGuard({ children, requiredLevel }: AuthGuardProps) {
  const location = useLocation();
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    void check();
  }, [checkAuth]);

  // 認証チェック中はローディング表示
  if (isChecking) {
    return (
      <div className="auth-loading">
        <p>認証を確認中...</p>
      </div>
    );
  }

  // 未認証の場合はログイン画面にリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 役職レベルチェック
  if (requiredLevel !== undefined && user) {
    if (user.position.level < requiredLevel) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-destructive">アクセス権限がありません</h1>
          <p className="mt-2 text-muted-foreground">このページを表示するための権限がありません。</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}

/**
 * 未認証のみアクセス可能なガード
 * ログイン済みユーザーを元のURLまたはダッシュボードにリダイレクト
 */
export function GuestGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    // ログイン前のURLがあればそこにリダイレクト、なければダッシュボードへ
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

/** 役職レベル定数 */
export const PositionLevel = {
  STAFF: 1,      // 担当
  MANAGER: 2,    // 課長
  DIRECTOR: 3,   // 部長
} as const;

type RoleGuardProps = {
  children: ReactNode;
  requiredLevel: number;
  fallback?: ReactNode;
};

/**
 * 役職別アクセス制御ガード
 * 指定した役職レベル以上のユーザーのみアクセス可能
 */
export function RoleGuard({ children, requiredLevel, fallback }: RoleGuardProps) {
  const { user } = useAuthStore();

  if (!user) {
    return null;
  }

  if (user.position.level < requiredLevel) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-destructive">アクセス権限がありません</h1>
        <p className="mt-2 text-muted-foreground">このページを表示するための権限がありません。</p>
      </div>
    );
  }

  return <>{children}</>;
}

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
        <div className="auth-forbidden">
          <h1>アクセス権限がありません</h1>
          <p>このページを表示するための権限がありません。</p>
        </div>
      );
    }
  }

  return <>{children}</>;
}

/**
 * 未認証のみアクセス可能なガード
 * ログイン済みユーザーをダッシュボードにリダイレクト
 */
export function GuestGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

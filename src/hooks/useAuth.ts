/**
 * 認証関連のカスタムフック
 * TanStack QueryとZustand認証ストアを統合
 */

import { useCallback } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as authApi from '@/lib/api/auth';
import { authKeys, authRequiredQueryOptions } from '@/lib/query';
import { useAuthStore } from '@/stores/auth';

import type { LoginRequest } from '@/schemas/api';

/**
 * 現在のユーザー情報を取得するフック
 */
export function useCurrentUser() {
  const { accessToken, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: async () => {
      const response = await authApi.getCurrentUser();
      return response.data;
    },
    enabled: isAuthenticated && !!accessToken,
    ...authRequiredQueryOptions,
  });
}

/**
 * ログインミューテーション
 */
export function useLogin() {
  const queryClient = useQueryClient();
  const login = useAuthStore((state) => state.login);

  return useMutation({
    mutationFn: async (request: LoginRequest) => {
      await login(request);
    },
    onSuccess: () => {
      // ログイン成功時にキャッシュをクリアして新鮮なデータを取得
      queryClient.invalidateQueries({ queryKey: authKeys.all });
    },
  });
}

/**
 * ログアウトミューテーション
 */
export function useLogout() {
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {
      // ログアウト時に全てのキャッシュをクリア
      queryClient.clear();
    },
  });
}

/**
 * 認証状態を管理するフック
 * Zustandストアとクエリの状態を統合
 */
export function useAuth() {
  const {
    user,
    accessToken,
    isAuthenticated,
    isLoading: isStoreLoading,
    error,
    clearError,
  } = useAuthStore();

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const { isLoading: isQueryLoading, refetch: refetchUser } = useCurrentUser();

  const handleLogin = useCallback(
    async (request: LoginRequest) => {
      await loginMutation.mutateAsync(request);
    },
    [loginMutation]
  );

  const handleLogout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  return {
    // 状態
    user,
    accessToken,
    isAuthenticated,
    isLoading: isStoreLoading || isQueryLoading,
    error,

    // アクション
    login: handleLogin,
    logout: handleLogout,
    clearError,
    refetchUser,

    // ミューテーション状態
    isLoginPending: loginMutation.isPending,
    isLogoutPending: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}

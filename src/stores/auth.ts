/**
 * 認証ストア
 * Zustandによる認証状態管理
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import * as authApi from '@/lib/api/auth';
import type { LoginRequest, LoginResponse } from '@/schemas/api';

type User = LoginResponse['user'];

type AuthState = {
  // 状態
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // アクション
  login: (request: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初期状態
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ログイン
      login: async (request: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authApi.login(request);
          const { access_token, refresh_token, user } = response.data;

          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'ログインに失敗しました';
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });
          throw error;
        }
      },

      // ログアウト
      logout: async () => {
        const { accessToken } = get();

        // サーバーサイドでトークンを無効化（エラーは無視）
        if (accessToken) {
          try {
            await authApi.logout();
          } catch {
            // ログアウトAPIのエラーは無視
          }
        }

        // ローカル状態をクリア
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      // トークンリフレッシュ
      refresh: async () => {
        const { refreshToken } = get();

        if (!refreshToken) {
          throw new Error('リフレッシュトークンがありません');
        }

        try {
          const response = await authApi.refreshToken(refreshToken);
          const { access_token, refresh_token, user } = response.data;

          set({
            user,
            accessToken: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
          });
        } catch (error) {
          // リフレッシュ失敗時はログアウト状態に
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // ユーザー情報を設定
      setUser: (user: User) => {
        set({ user });
      },

      // トークンを設定
      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      // エラーをクリア
      clearError: () => {
        set({ error: null });
      },

      // 認証状態を確認
      checkAuth: async () => {
        const { accessToken, refresh } = get();

        if (!accessToken) {
          set({ isAuthenticated: false });
          return;
        }

        try {
          const response = await authApi.getCurrentUser();
          set({
            user: response.data,
            isAuthenticated: true,
          });
        } catch {
          // アクセストークンが無効な場合、リフレッシュを試みる
          try {
            await refresh();
          } catch {
            // リフレッシュも失敗した場合は未認証状態に
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
            });
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

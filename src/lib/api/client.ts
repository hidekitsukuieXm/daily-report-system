/**
 * API Client
 * Axiosインスタンスとインターセプター設定
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';

import { useAuthStore } from '@/stores/auth';

const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
const BASE_URL = envBaseUrl ?? '/api/v1';

/**
 * APIクライアントの作成
 */
function createApiClient(): AxiosInstance {
  const client: AxiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // リクエストインターセプター: トークンを付与
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );

  // レスポンスインターセプター: トークンリフレッシュ処理
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // 401エラーかつリトライしていない場合
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const { refreshToken, refresh, logout } = useAuthStore.getState();

        if (refreshToken) {
          try {
            // トークンをリフレッシュ
            await refresh();

            // 新しいトークンで再リクエスト
            const { accessToken } = useAuthStore.getState();
            if (accessToken) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return client(originalRequest);
            }
          } catch {
            // リフレッシュ失敗時はログアウト
            void logout();
          }
        } else {
          // リフレッシュトークンがない場合はログアウト
          void logout();
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}

export const apiClient = createApiClient();

/**
 * APIエラーレスポンスの型
 */
export type ApiErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

/**
 * APIエラーを抽出
 */
export function extractApiError(error: unknown): ApiErrorResponse['error'] {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (data?.error) {
      return data.error;
    }
    return {
      code: 'NETWORK_ERROR',
      message: error.message || 'ネットワークエラーが発生しました',
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: '予期しないエラーが発生しました',
  };
}

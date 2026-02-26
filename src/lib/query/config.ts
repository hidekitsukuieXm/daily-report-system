/**
 * TanStack Query - 設定とユーティリティ
 * Query Clientの設定とデフォルトオプション
 */

import type { QueryClientConfig } from '@tanstack/react-query';

/**
 * デフォルトのstaleTime（データが古くなるまでの時間）
 */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000; // 5分

/**
 * デフォルトのcacheTime（キャッシュが破棄されるまでの時間）
 */
export const DEFAULT_GC_TIME = 10 * 60 * 1000; // 10分

/**
 * QueryClientのデフォルト設定
 */
export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_GC_TIME,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
};

/**
 * 認証が必要なクエリのデフォルトオプション
 * 認証エラー時は自動リトライしない
 */
export const authRequiredQueryOptions = {
  retry: (failureCount: number, error: unknown) => {
    // 401エラーの場合はリトライしない（インターセプターでリフレッシュを試みるため）
    if (
      error instanceof Error &&
      'response' in error &&
      typeof (error as { response?: { status?: number } }).response?.status ===
        'number'
    ) {
      const status = (error as { response: { status: number } }).response
        .status;
      if (status === 401 || status === 403) {
        return false;
      }
    }
    return failureCount < 1;
  },
} as const;

/**
 * マスタデータ用のクエリオプション
 * マスタデータは変更頻度が低いため長めのstaleTimeを設定
 */
export const masterDataQueryOptions = {
  staleTime: 30 * 60 * 1000, // 30分
  gcTime: 60 * 60 * 1000, // 1時間
} as const;

/**
 * リアルタイム更新が必要なデータ用のクエリオプション
 * 短めのstaleTimeで最新データを維持
 */
export const realtimeQueryOptions = {
  staleTime: 30 * 1000, // 30秒
  refetchInterval: 60 * 1000, // 1分ごとに自動リフェッチ
} as const;

/**
 * 無限スクロール用のクエリオプション
 */
export const infiniteQueryOptions = {
  staleTime: 5 * 60 * 1000, // 5分
  getNextPageParam: <T extends { pagination: { currentPage: number; totalPages: number } }>(
    lastPage: T
  ) => {
    const { currentPage, totalPages } = lastPage.pagination;
    return currentPage < totalPages ? currentPage + 1 : undefined;
  },
} as const;

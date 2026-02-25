/**
 * 承認待ちストア
 * Zustandによる承認待ち一覧状態管理
 */

import { create } from 'zustand';

import * as approvalsApi from '@/lib/api/approvals';
import { extractApiError } from '@/lib/api/client';
import type { DailyReportSummary, Pagination } from '@/schemas/data';

type ApprovalState = {
  // 一覧状態
  approvals: DailyReportSummary[];
  pagination: Pagination | null;
  searchQuery: Partial<approvalsApi.ApprovalSearchQuery>;

  // UI状態
  isLoading: boolean;
  error: string | null;

  // アクション
  fetchApprovals: (
    query?: Partial<approvalsApi.ApprovalSearchQuery>
  ) => Promise<void>;
  setSearchQuery: (query: Partial<approvalsApi.ApprovalSearchQuery>) => void;
  clearApprovals: () => void;
  clearError: () => void;
};

export const useApprovalStore = create<ApprovalState>()((set, get) => ({
  // 初期状態
  approvals: [],
  pagination: null,
  searchQuery: {},
  isLoading: false,
  error: null,

  // 承認待ち一覧を取得
  fetchApprovals: async (query?: Partial<approvalsApi.ApprovalSearchQuery>) => {
    set({ isLoading: true, error: null });

    try {
      const mergedQuery = { ...get().searchQuery, ...query };
      const result = await approvalsApi.getApprovals(mergedQuery);

      set({
        approvals: result.items,
        pagination: result.pagination,
        searchQuery: mergedQuery,
        isLoading: false,
      });
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isLoading: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 検索条件を設定
  setSearchQuery: (query: Partial<approvalsApi.ApprovalSearchQuery>) => {
    set({ searchQuery: query });
  },

  // 承認待ち一覧をクリア
  clearApprovals: () => {
    set({
      approvals: [],
      pagination: null,
      searchQuery: {},
    });
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));

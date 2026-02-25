/**
 * 承認ストア
 * Zustandによる承認状態管理
 */

import { create } from 'zustand';

import * as approvalsApi from '@/lib/api/approvals';
import type {
  ApprovalsQuery,
  ApprovalActionResponse,
} from '@/lib/api/approvals';
import type { ApproveRequest, RejectRequest } from '@/schemas/api';
import type { DailyReportSummary, Pagination } from '@/schemas/data';

type ApprovalsState = {
  // 状態
  approvals: DailyReportSummary[];
  pagination: Pagination | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;

  // アクション
  fetchApprovals: (query?: ApprovalsQuery) => Promise<void>;
  approveReport: (
    reportId: number,
    request?: ApproveRequest
  ) => Promise<ApprovalActionResponse>;
  rejectReport: (
    reportId: number,
    request: RejectRequest
  ) => Promise<ApprovalActionResponse>;
  clearError: () => void;
  reset: () => void;
};

const initialState = {
  approvals: [],
  pagination: null,
  isLoading: false,
  isActionLoading: false,
  error: null,
};

export const useApprovalsStore = create<ApprovalsState>()((set, get) => ({
  ...initialState,

  // 承認待ち一覧を取得
  fetchApprovals: async (query?: ApprovalsQuery) => {
    set({ isLoading: true, error: null });

    try {
      const response = await approvalsApi.getApprovals(query);
      const { items, pagination } = response.data;

      set({
        approvals: items,
        pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : '承認待ち一覧の取得に失敗しました';
      set({
        approvals: [],
        pagination: null,
        isLoading: false,
        error: message,
      });
      throw error;
    }
  },

  // 日報を承認
  approveReport: async (reportId: number, request?: ApproveRequest) => {
    set({ isActionLoading: true, error: null });

    try {
      const response = await approvalsApi.approveReport(reportId, request);

      // 承認後、一覧から該当日報を除去
      const { approvals } = get();
      set({
        approvals: approvals.filter((a) => a.id !== reportId),
        isActionLoading: false,
        error: null,
      });

      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '承認に失敗しました';
      set({
        isActionLoading: false,
        error: message,
      });
      throw error;
    }
  },

  // 日報を差戻し
  rejectReport: async (reportId: number, request: RejectRequest) => {
    set({ isActionLoading: true, error: null });

    try {
      const response = await approvalsApi.rejectReport(reportId, request);

      // 差戻し後、一覧から該当日報を除去
      const { approvals } = get();
      set({
        approvals: approvals.filter((a) => a.id !== reportId),
        isActionLoading: false,
        error: null,
      });

      return response.data;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '差戻しに失敗しました';
      set({
        isActionLoading: false,
        error: message,
      });
      throw error;
    }
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },

  // 状態をリセット
  reset: () => {
    set(initialState);
  },
}));

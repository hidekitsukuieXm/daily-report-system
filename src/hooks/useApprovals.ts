/**
 * 承認関連のカスタムフック
 * TanStack Queryによるデータ取得・更新
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as approvalsApi from '@/lib/api/approvals';
import {
  approvalKeys,
  authRequiredQueryOptions,
  realtimeQueryOptions,
  reportKeys,
} from '@/lib/query';

import type { ApproveRequest, RejectRequest } from '@/schemas/api';

/**
 * 承認待ち一覧を取得するフック
 * 承認待ちデータは比較的リアルタイム性が求められるため、短いstaleTimeを使用
 */
export function useApprovals(query?: approvalsApi.ApprovalsQuery) {
  return useQuery({
    queryKey: approvalKeys.list(query),
    queryFn: async () => {
      const response = await approvalsApi.getApprovals(query);
      return response.data;
    },
    ...authRequiredQueryOptions,
    ...realtimeQueryOptions,
  });
}

/**
 * 日報承認ミューテーション
 */
export function useApproveReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      request,
    }: {
      reportId: number;
      request?: ApproveRequest;
    }) => approvalsApi.approveReport(reportId, request),
    onSuccess: (_, variables) => {
      // 承認待ち一覧と日報詳細のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: approvalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: reportKeys.detail(variables.reportId),
      });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/**
 * 日報差戻しミューテーション
 */
export function useRejectReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reportId,
      request,
    }: {
      reportId: number;
      request: RejectRequest;
    }) => approvalsApi.rejectReport(reportId, request),
    onSuccess: (_, variables) => {
      // 承認待ち一覧と日報詳細のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: approvalKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: reportKeys.detail(variables.reportId),
      });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/**
 * 承認履歴を取得するフック
 */
export function useApprovalHistory(
  reportId: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [...reportKeys.detail(reportId), 'approvalHistory'] as const,
    queryFn: async () => {
      const response = await approvalsApi.getApprovalHistory(reportId);
      return response.data;
    },
    enabled: options?.enabled !== false && reportId > 0,
    ...authRequiredQueryOptions,
  });
}

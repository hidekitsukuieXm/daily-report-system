/**
 * 日報関連のカスタムフック
 * TanStack Queryによるデータ取得・更新
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import * as reportsApi from '@/lib/api/reports';
import { authRequiredQueryOptions, reportKeys } from '@/lib/query';

import type { CreateReportRequest, ReportSearchQuery, UpdateReportRequest } from '@/schemas/api';

/**
 * 日報一覧を取得するフック
 */
export function useReports(query?: Partial<ReportSearchQuery>) {
  return useQuery({
    queryKey: reportKeys.list(query ?? {}),
    queryFn: () => reportsApi.getReports(query),
    ...authRequiredQueryOptions,
  });
}

/**
 * 日報詳細を取得するフック
 */
export function useReport(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => reportsApi.getReport(id),
    enabled: options?.enabled !== false && id > 0,
    ...authRequiredQueryOptions,
  });
}

/**
 * 日報作成ミューテーション
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReportRequest) => reportsApi.createReport(data),
    onSuccess: () => {
      // 一覧キャッシュを無効化
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/**
 * 日報更新ミューテーション
 */
export function useUpdateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateReportRequest }) =>
      reportsApi.updateReport(id, data),
    onSuccess: (_, variables) => {
      // 詳細と一覧のキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: reportKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/**
 * 日報削除ミューテーション
 */
export function useDeleteReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reportsApi.deleteReport(id),
    onSuccess: (_, id) => {
      // 詳細キャッシュを削除し、一覧を無効化
      queryClient.removeQueries({ queryKey: reportKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

/**
 * 日報提出ミューテーション
 */
export function useSubmitReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => reportsApi.submitReport(id),
    onSuccess: (_, id) => {
      // 詳細と一覧のキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: reportKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: reportKeys.lists() });
    },
  });
}

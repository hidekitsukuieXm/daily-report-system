/**
 * 承認待ちAPI
 */

import type { DailyReportSummary, PaginatedList } from '@/schemas/data';

import { apiClient } from './client';

import type { AxiosResponse } from 'axios';

/**
 * APIレスポンスの型
 */
type ApiResponse<T> = {
  success: true;
  data: T;
};

/**
 * 承認待ち検索クエリ
 */
export type ApprovalSearchQuery = {
  page?: number;
  per_page?: number;
  date_from?: string;
  date_to?: string;
};

/**
 * 承認待ち一覧を取得
 */
export async function getApprovals(
  query?: Partial<ApprovalSearchQuery>
): Promise<PaginatedList<DailyReportSummary>> {
  const response: AxiosResponse<
    ApiResponse<PaginatedList<DailyReportSummary>>
  > = await apiClient.get('/approvals', { params: query });
  return response.data.data;
}

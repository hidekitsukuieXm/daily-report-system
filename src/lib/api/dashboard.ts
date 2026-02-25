/**
 * ダッシュボードAPI
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
 * ダッシュボードサマリー
 */
export type DashboardSummary = {
  visitCount: number;
  reportCount: number;
  pendingApprovalCount: number;
};

/**
 * ダッシュボードサマリーを取得
 * 今月の訪問件数、日報作成数、承認待ち件数を取得
 */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response: AxiosResponse<ApiResponse<DashboardSummary>> =
    await apiClient.get('/dashboard/summary');
  return response.data.data;
}

/**
 * 直近の日報を取得（最新5件）
 */
export async function getRecentReports(): Promise<DailyReportSummary[]> {
  const response: AxiosResponse<
    ApiResponse<PaginatedList<DailyReportSummary>>
  > = await apiClient.get('/reports', {
    params: {
      per_page: 5,
      sort: 'report_date',
      order: 'desc',
    },
  });
  return response.data.data.items;
}

/**
 * 承認待ち日報を取得（最新5件）
 * 上長のみ使用可能
 */
export async function getPendingApprovals(): Promise<DailyReportSummary[]> {
  const response: AxiosResponse<
    ApiResponse<PaginatedList<DailyReportSummary>>
  > = await apiClient.get('/approvals', {
    params: {
      per_page: 5,
    },
  });
  return response.data.data.items;
}

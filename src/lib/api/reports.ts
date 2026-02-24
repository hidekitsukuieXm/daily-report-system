/**
 * 日報API
 */

import type {
  CreateReportRequest,
  ReportSearchQuery,
  UpdateReportRequest,
} from '@/schemas/api';
import type {
  DailyReportDetail,
  DailyReportSummary,
  PaginatedList,
} from '@/schemas/data';

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
 * 日報一覧を取得
 */
export async function getReports(
  query?: Partial<ReportSearchQuery>
): Promise<PaginatedList<DailyReportSummary>> {
  const response: AxiosResponse<
    ApiResponse<PaginatedList<DailyReportSummary>>
  > = await apiClient.get('/reports', { params: query });
  return response.data.data;
}

/**
 * 日報詳細を取得
 */
export async function getReport(id: number): Promise<DailyReportDetail> {
  const response: AxiosResponse<ApiResponse<DailyReportDetail>> =
    await apiClient.get(`/reports/${id}`);
  return response.data.data;
}

/**
 * 日報を作成
 */
export async function createReport(
  data: CreateReportRequest
): Promise<DailyReportDetail> {
  const response: AxiosResponse<ApiResponse<DailyReportDetail>> =
    await apiClient.post('/reports', data);
  return response.data.data;
}

/**
 * 日報を更新
 */
export async function updateReport(
  id: number,
  data: UpdateReportRequest
): Promise<DailyReportDetail> {
  const response: AxiosResponse<ApiResponse<DailyReportDetail>> =
    await apiClient.put(`/reports/${id}`, data);
  return response.data.data;
}

/**
 * 日報を削除
 */
export async function deleteReport(id: number): Promise<void> {
  await apiClient.delete(`/reports/${id}`);
}

/**
 * 日報を提出
 */
export async function submitReport(
  id: number
): Promise<{ id: number; status: string; submitted_at: string }> {
  const response: AxiosResponse<
    ApiResponse<{ id: number; status: string; submitted_at: string }>
  > = await apiClient.post(`/reports/${id}/submit`);
  return response.data.data;
}

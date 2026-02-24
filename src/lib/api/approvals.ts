/**
 * 承認API
 */

import type { ApproveRequest, RejectRequest } from '@/schemas/api';
import type {
  DailyReportSummary,
  Pagination,
  ApprovalHistory,
} from '@/schemas/data';

import { apiClient } from './client';

type ApiResponse<T> = {
  success: true;
  data: T;
};

/**
 * 承認待ち一覧レスポンス
 */
export type ApprovalsListResponse = {
  items: DailyReportSummary[];
  pagination: Pagination;
};

/**
 * 承認処理レスポンス
 */
export type ApprovalActionResponse = {
  id: number;
  status: string;
  manager_approved_at?: string | null;
  director_approved_at?: string | null;
};

/**
 * 承認待ち一覧クエリパラメータ
 */
export type ApprovalsQuery = {
  page?: number;
  per_page?: number;
};

/**
 * 承認待ち一覧を取得
 */
export async function getApprovals(
  query?: ApprovalsQuery
): Promise<ApiResponse<ApprovalsListResponse>> {
  const response = await apiClient.get<ApiResponse<ApprovalsListResponse>>(
    '/approvals',
    { params: query }
  );
  return response.data;
}

/**
 * 日報を承認
 */
export async function approveReport(
  reportId: number,
  request?: ApproveRequest
): Promise<ApiResponse<ApprovalActionResponse>> {
  const response = await apiClient.post<ApiResponse<ApprovalActionResponse>>(
    `/reports/${reportId}/approve`,
    request ?? {}
  );
  return response.data;
}

/**
 * 日報を差戻し
 */
export async function rejectReport(
  reportId: number,
  request: RejectRequest
): Promise<ApiResponse<ApprovalActionResponse>> {
  const response = await apiClient.post<ApiResponse<ApprovalActionResponse>>(
    `/reports/${reportId}/reject`,
    request
  );
  return response.data;
}

/**
 * 日報の承認履歴を取得
 */
export async function getApprovalHistory(
  reportId: number
): Promise<ApiResponse<ApprovalHistory[]>> {
  const response = await apiClient.get<ApiResponse<ApprovalHistory[]>>(
    `/reports/${reportId}/approval-history`
  );
  return response.data;
}

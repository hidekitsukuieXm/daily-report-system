/**
 * 訪問記録API
 */

import type { CreateVisitRequest, UpdateVisitRequest } from '@/schemas/api';
import type { VisitRecordWithCustomer } from '@/schemas/data';

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
 * 訪問記録一覧レスポンス
 */
type VisitListResponse = {
  items: VisitRecordWithCustomer[];
};

/**
 * 訪問記録一覧を取得
 */
export async function getVisits(
  reportId: number
): Promise<VisitRecordWithCustomer[]> {
  const response: AxiosResponse<ApiResponse<VisitListResponse>> =
    await apiClient.get(`/reports/${reportId}/visits`);
  return response.data.data.items;
}

/**
 * 訪問記録を作成
 */
export async function createVisit(
  reportId: number,
  data: CreateVisitRequest
): Promise<VisitRecordWithCustomer> {
  const response: AxiosResponse<ApiResponse<VisitRecordWithCustomer>> =
    await apiClient.post(`/reports/${reportId}/visits`, data);
  return response.data.data;
}

/**
 * 訪問記録を更新
 */
export async function updateVisit(
  id: number,
  data: UpdateVisitRequest
): Promise<VisitRecordWithCustomer> {
  const response: AxiosResponse<ApiResponse<VisitRecordWithCustomer>> =
    await apiClient.put(`/visits/${id}`, data);
  return response.data.data;
}

/**
 * 訪問記録を削除
 */
export async function deleteVisit(id: number): Promise<void> {
  await apiClient.delete(`/visits/${id}`);
}

/**
 * 営業担当者API
 */

import type {
  CreateSalespersonRequest,
  SalespersonSearchQuery,
  UpdateSalespersonRequest,
} from '@/schemas/api';
import type { PaginatedList, SalespersonWithRelations } from '@/schemas/data';

import { apiClient } from './client';

type ApiResponse<T> = {
  success: true;
  data: T;
};

/**
 * 営業担当者一覧を取得
 */
export async function getSalespersons(
  query?: Partial<SalespersonSearchQuery>
): Promise<PaginatedList<SalespersonWithRelations>> {
  const response = await apiClient.get<
    ApiResponse<PaginatedList<SalespersonWithRelations>>
  >('/salespersons', { params: query });
  return response.data.data;
}

/**
 * 営業担当者詳細を取得
 */
export async function getSalesperson(
  id: number
): Promise<SalespersonWithRelations> {
  const response = await apiClient.get<ApiResponse<SalespersonWithRelations>>(
    `/salespersons/${id}`
  );
  return response.data.data;
}

/**
 * 営業担当者を新規作成
 */
export async function createSalesperson(
  data: CreateSalespersonRequest
): Promise<SalespersonWithRelations> {
  const response = await apiClient.post<ApiResponse<SalespersonWithRelations>>(
    '/salespersons',
    data
  );
  return response.data.data;
}

/**
 * 営業担当者を更新
 */
export async function updateSalesperson(
  id: number,
  data: UpdateSalespersonRequest
): Promise<SalespersonWithRelations> {
  const response = await apiClient.put<ApiResponse<SalespersonWithRelations>>(
    `/salespersons/${id}`,
    data
  );
  return response.data.data;
}

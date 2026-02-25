/**
 * 営業担当者マスタAPI
 */

import type { SalespersonSearchQuery } from '@/schemas/api';
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
  >('/salespersons', {
    params: query,
  });
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

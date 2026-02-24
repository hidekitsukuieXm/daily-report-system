/**
 * 営業担当者API
 */

import type {
  SalespersonSearchQuery,
  CreateSalespersonRequest,
  UpdateSalespersonRequest,
} from '@/schemas/api';
import type {
  Salesperson,
  SalespersonWithRelations,
  PaginatedList,
  Position,
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
 * 営業担当者一覧を取得
 */
export async function getSalespersons(
  query?: Partial<SalespersonSearchQuery>
): Promise<PaginatedList<SalespersonWithRelations>> {
  const response: AxiosResponse<
    ApiResponse<PaginatedList<SalespersonWithRelations>>
  > = await apiClient.get('/salespersons', { params: query });
  return response.data.data;
}

/**
 * 営業担当者詳細を取得
 */
export async function getSalesperson(
  id: number
): Promise<SalespersonWithRelations> {
  const response: AxiosResponse<ApiResponse<SalespersonWithRelations>> =
    await apiClient.get(`/salespersons/${id}`);
  return response.data.data;
}

/**
 * 営業担当者を作成
 */
export async function createSalesperson(
  data: CreateSalespersonRequest
): Promise<Salesperson> {
  const response: AxiosResponse<ApiResponse<Salesperson>> =
    await apiClient.post('/salespersons', data);
  return response.data.data;
}

/**
 * 営業担当者を更新
 */
export async function updateSalesperson(
  id: number,
  data: UpdateSalespersonRequest
): Promise<Salesperson> {
  const response: AxiosResponse<ApiResponse<Salesperson>> = await apiClient.put(
    `/salespersons/${id}`,
    data
  );
  return response.data.data;
}

/**
 * 営業担当者を削除
 */
export async function deleteSalesperson(id: number): Promise<void> {
  await apiClient.delete(`/salespersons/${id}`);
}

/**
 * 役職一覧を取得（営業担当者用）
 */
export async function getSalespersonPositions(): Promise<Position[]> {
  const response: AxiosResponse<ApiResponse<Position[]>> =
    await apiClient.get('/positions');
  return response.data.data;
}

/**
 * 課長一覧を取得（上長選択用）
 */
export async function getManagers(): Promise<
  Pick<Salesperson, 'id' | 'name'>[]
> {
  const response: AxiosResponse<
    ApiResponse<Pick<Salesperson, 'id' | 'name'>[]>
  > = await apiClient.get('/salespersons/managers');
  return response.data.data;
}

/**
 * 部長一覧を取得（上長選択用）
 */
export async function getDirectors(): Promise<
  Pick<Salesperson, 'id' | 'name'>[]
> {
  const response: AxiosResponse<
    ApiResponse<Pick<Salesperson, 'id' | 'name'>[]>
  > = await apiClient.get('/salespersons/directors');
  return response.data.data;
}

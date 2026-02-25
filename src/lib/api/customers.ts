/**
 * 顧客API
 */

import type { CustomerSearchQuery } from '@/schemas/api';
import type { Customer, PaginatedList } from '@/schemas/data';

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
 * 顧客一覧を取得
 */
export async function getCustomers(
  query?: Partial<CustomerSearchQuery>
): Promise<PaginatedList<Customer>> {
  const response: AxiosResponse<ApiResponse<PaginatedList<Customer>>> =
    await apiClient.get('/customers', { params: query });
  return response.data.data;
}

/**
 * 顧客詳細を取得
 */
export async function getCustomer(id: number): Promise<Customer> {
  const response: AxiosResponse<ApiResponse<Customer>> = await apiClient.get(
    `/customers/${id}`
  );
  return response.data.data;
}

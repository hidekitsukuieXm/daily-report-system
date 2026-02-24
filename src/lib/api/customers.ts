/**
 * 顧客API
 */

import type {
  CustomerSearchQuery,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/schemas/api';
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

/**
 * 顧客を作成
 */
export async function createCustomer(
  data: CreateCustomerRequest
): Promise<Customer> {
  const response: AxiosResponse<ApiResponse<Customer>> = await apiClient.post(
    '/customers',
    data
  );
  return response.data.data;
}

/**
 * 顧客を更新
 */
export async function updateCustomer(
  id: number,
  data: UpdateCustomerRequest
): Promise<Customer> {
  const response: AxiosResponse<ApiResponse<Customer>> = await apiClient.put(
    `/customers/${id}`,
    data
  );
  return response.data.data;
}

/**
 * 顧客を削除（論理削除）
 */
export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}

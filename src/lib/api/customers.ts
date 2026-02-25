/**
 * 顧客マスタAPI
 */

import type {
  CreateCustomerRequest,
  CustomerSearchQuery,
  UpdateCustomerRequest,
} from '@/schemas/api';
import type { Customer, PaginatedList } from '@/schemas/data';

import { apiClient } from './client';

type ApiResponse<T> = {
  success: true;
  data: T;
};

/**
 * 顧客一覧取得
 */
export async function getCustomers(
  query?: Partial<CustomerSearchQuery>
): Promise<PaginatedList<Customer>> {
  const params = new URLSearchParams();

  if (query?.page) params.set('page', String(query.page));
  if (query?.per_page) params.set('per_page', String(query.per_page));
  if (query?.name) params.set('name', query.name);
  if (query?.industry) params.set('industry', query.industry);
  if (query?.is_active !== undefined)
    params.set('is_active', String(query.is_active));
  if (query?.sort) params.set('sort', query.sort);
  if (query?.order) params.set('order', query.order);

  const queryString = params.toString();
  const url = queryString ? `/customers?${queryString}` : '/customers';

  const response =
    await apiClient.get<ApiResponse<PaginatedList<Customer>>>(url);
  return response.data.data;
}

/**
 * 顧客詳細取得
 */
export async function getCustomer(id: number): Promise<Customer> {
  const response = await apiClient.get<ApiResponse<Customer>>(
    `/customers/${id}`
  );
  return response.data.data;
}

/**
 * 顧客作成
 */
export async function createCustomer(
  data: CreateCustomerRequest
): Promise<Customer> {
  const response = await apiClient.post<ApiResponse<Customer>>(
    '/customers',
    data
  );
  return response.data.data;
}

/**
 * 顧客更新
 */
export async function updateCustomer(
  id: number,
  data: UpdateCustomerRequest
): Promise<Customer> {
  const response = await apiClient.put<ApiResponse<Customer>>(
    `/customers/${id}`,
    data
  );
  return response.data.data;
}

/**
 * 顧客削除（論理削除）
 */
export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}

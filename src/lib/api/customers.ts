/**
 * 顧客API
 * 顧客マスタのCRUD操作
 */

import type {
  CreateCustomerRequest,
  CustomerSearchQuery,
  UpdateCustomerRequest,
} from '@/schemas/api';
import type { Customer, PaginatedList } from '@/schemas/data';

import { apiClient, extractApiError } from './client';

type CustomerListResponse = {
  success: boolean;
  data: {
    items: Customer[];
    pagination: {
      currentPage: number;
      perPage: number;
      totalPages: number;
      totalCount: number;
    };
  };
};

type CustomerResponse = {
  success: boolean;
  data: Customer;
};

/**
 * 顧客一覧を取得
 */
export async function getCustomers(
  params?: Partial<CustomerSearchQuery>
): Promise<PaginatedList<Customer>> {
  try {
    const response = await apiClient.get<CustomerListResponse>('/customers', {
      params,
    });
    return response.data.data;
  } catch (error) {
    const apiError = extractApiError(error);
    throw new Error(apiError.message);
  }
}

/**
 * 顧客詳細を取得
 */
export async function getCustomer(id: number): Promise<Customer> {
  try {
    const response = await apiClient.get<CustomerResponse>(`/customers/${id}`);
    return response.data.data;
  } catch (error) {
    const apiError = extractApiError(error);
    throw new Error(apiError.message);
  }
}

/**
 * 顧客を作成
 */
export async function createCustomer(
  data: CreateCustomerRequest
): Promise<Customer> {
  try {
    const response = await apiClient.post<CustomerResponse>('/customers', data);
    return response.data.data;
  } catch (error) {
    const apiError = extractApiError(error);
    throw new Error(apiError.message);
  }
}

/**
 * 顧客を更新
 */
export async function updateCustomer(
  id: number,
  data: UpdateCustomerRequest
): Promise<Customer> {
  try {
    const response = await apiClient.put<CustomerResponse>(
      `/customers/${id}`,
      data
    );
    return response.data.data;
  } catch (error) {
    const apiError = extractApiError(error);
    throw new Error(apiError.message);
  }
}

/**
 * 顧客を削除（論理削除）
 */
export async function deleteCustomer(id: number): Promise<void> {
  try {
    await apiClient.delete(`/customers/${id}`);
  } catch (error) {
    const apiError = extractApiError(error);
    throw new Error(apiError.message);
  }
}

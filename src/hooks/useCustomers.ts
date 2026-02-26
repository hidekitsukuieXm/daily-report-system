/**
 * 顧客関連のカスタムフック
 * TanStack Queryによるデータ取得
 */

import { useQuery } from '@tanstack/react-query';

import * as customersApi from '@/lib/api/customers';
import { authRequiredQueryOptions, customerKeys, masterDataQueryOptions } from '@/lib/query';

import type { CustomerSearchQuery } from '@/schemas/api';

/**
 * 顧客一覧を取得するフック
 */
export function useCustomers(query?: Partial<CustomerSearchQuery>) {
  return useQuery({
    queryKey: customerKeys.list(query),
    queryFn: () => customersApi.getCustomers(query),
    ...authRequiredQueryOptions,
  });
}

/**
 * 顧客詳細を取得するフック
 */
export function useCustomer(id: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => customersApi.getCustomer(id),
    enabled: options?.enabled !== false && id > 0,
    ...authRequiredQueryOptions,
  });
}

/**
 * 有効な顧客一覧を取得するフック（セレクトボックス用）
 * マスタデータとして長めのキャッシュを使用
 */
export function useActiveCustomers() {
  return useQuery({
    queryKey: customerKeys.list({ is_active: true }),
    queryFn: () => customersApi.getCustomers({ is_active: true, per_page: 100 }),
    ...authRequiredQueryOptions,
    ...masterDataQueryOptions,
    select: (data) => data.items,
  });
}

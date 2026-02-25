/**
 * 顧客ストア
 * Zustandによる顧客状態管理
 */

import { create } from 'zustand';

import { extractApiError } from '@/lib/api/client';
import * as customersApi from '@/lib/api/customers';
import type { CustomerSearchQuery } from '@/schemas/api';
import type { Customer, Pagination } from '@/schemas/data';

type CustomerState = {
  // 一覧状態
  customers: Customer[];
  pagination: Pagination | null;
  searchQuery: Partial<CustomerSearchQuery>;

  // UI状態
  isLoading: boolean;
  error: string | null;

  // 一覧アクション
  fetchCustomers: (query?: Partial<CustomerSearchQuery>) => Promise<void>;
  setSearchQuery: (query: Partial<CustomerSearchQuery>) => void;
  clearCustomers: () => void;

  // エラーアクション
  clearError: () => void;
};

export const useCustomerStore = create<CustomerState>()((set, get) => ({
  // 初期状態
  customers: [],
  pagination: null,
  searchQuery: {},
  isLoading: false,
  error: null,

  // 顧客一覧を取得
  fetchCustomers: async (query?: Partial<CustomerSearchQuery>) => {
    set({ isLoading: true, error: null });

    try {
      const mergedQuery = { ...get().searchQuery, ...query };
      const result = await customersApi.getCustomers(mergedQuery);

      set({
        customers: result.items,
        pagination: result.pagination,
        searchQuery: mergedQuery,
        isLoading: false,
      });
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isLoading: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 検索条件を設定
  setSearchQuery: (query: Partial<CustomerSearchQuery>) => {
    set({ searchQuery: query });
  },

  // 顧客一覧をクリア
  clearCustomers: () => {
    set({
      customers: [],
      pagination: null,
      searchQuery: {},
    });
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));

/**
 * 顧客ストア
 * Zustandによる顧客マスタ状態管理
 */

import { create } from 'zustand';

import * as customersApi from '@/lib/api/customers';
import type {
  CustomerSearchQuery,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/schemas/api';
import type { Customer, Pagination } from '@/schemas/data';

type CustomersState = {
  // 状態
  customers: Customer[];
  selectedCustomer: Customer | null;
  pagination: Pagination | null;
  searchQuery: Partial<CustomerSearchQuery>;
  isLoading: boolean;
  error: string | null;

  // アクション
  fetchCustomers: (query?: Partial<CustomerSearchQuery>) => Promise<void>;
  fetchCustomer: (id: number) => Promise<void>;
  createCustomer: (data: CreateCustomerRequest) => Promise<Customer>;
  updateCustomer: (
    id: number,
    data: UpdateCustomerRequest
  ) => Promise<Customer>;
  deleteCustomer: (id: number) => Promise<void>;
  setSearchQuery: (query: Partial<CustomerSearchQuery>) => void;
  clearSelectedCustomer: () => void;
  clearError: () => void;
};

export const useCustomersStore = create<CustomersState>()((set, get) => ({
  // 初期状態
  customers: [],
  selectedCustomer: null,
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
      const message =
        error instanceof Error ? error.message : '顧客一覧の取得に失敗しました';
      set({
        customers: [],
        pagination: null,
        isLoading: false,
        error: message,
      });
      throw error;
    }
  },

  // 顧客詳細を取得
  fetchCustomer: async (id: number) => {
    set({ isLoading: true, error: null });

    try {
      const customer = await customersApi.getCustomer(id);
      set({
        selectedCustomer: customer,
        isLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '顧客の取得に失敗しました';
      set({
        selectedCustomer: null,
        isLoading: false,
        error: message,
      });
      throw error;
    }
  },

  // 顧客を作成
  createCustomer: async (data: CreateCustomerRequest) => {
    set({ isLoading: true, error: null });

    try {
      const customer = await customersApi.createCustomer(data);

      // 一覧を更新
      const { customers } = get();
      set({
        customers: [customer, ...customers],
        isLoading: false,
      });

      return customer;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '顧客の作成に失敗しました';
      set({
        isLoading: false,
        error: message,
      });
      throw error;
    }
  },

  // 顧客を更新
  updateCustomer: async (id: number, data: UpdateCustomerRequest) => {
    set({ isLoading: true, error: null });

    try {
      const customer = await customersApi.updateCustomer(id, data);

      // 一覧とselectedCustomerを更新
      const { customers, selectedCustomer } = get();
      set({
        customers: customers.map((c) => (c.id === id ? customer : c)),
        selectedCustomer:
          selectedCustomer?.id === id ? customer : selectedCustomer,
        isLoading: false,
      });

      return customer;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '顧客の更新に失敗しました';
      set({
        isLoading: false,
        error: message,
      });
      throw error;
    }
  },

  // 顧客を削除（論理削除）
  deleteCustomer: async (id: number) => {
    set({ isLoading: true, error: null });

    try {
      await customersApi.deleteCustomer(id);

      // 一覧から削除（または非活性化として更新）
      const { customers, selectedCustomer } = get();
      set({
        customers: customers.map((c) =>
          c.id === id ? { ...c, isActive: false } : c
        ),
        selectedCustomer:
          selectedCustomer?.id === id
            ? { ...selectedCustomer, isActive: false }
            : selectedCustomer,
        isLoading: false,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '顧客の削除に失敗しました';
      set({
        isLoading: false,
        error: message,
      });
      throw error;
    }
  },

  // 検索クエリを設定
  setSearchQuery: (query: Partial<CustomerSearchQuery>) => {
    set({ searchQuery: query });
  },

  // 選択中の顧客をクリア
  clearSelectedCustomer: () => {
    set({ selectedCustomer: null });
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));

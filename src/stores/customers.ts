/**
 * 顧客ストア
 * Zustandによる顧客データ管理
 */

import { create } from 'zustand';

import * as customersApi from '@/lib/api/customers';
import * as mastersApi from '@/lib/api/masters';
import type { IndustryMaster } from '@/lib/api/masters';
import type {
  CreateCustomerRequest,
  CustomerSearchQuery,
  UpdateCustomerRequest,
} from '@/schemas/api';
import type { Customer, PaginatedList } from '@/schemas/data';

type CustomerState = {
  // 状態
  customers: PaginatedList<Customer> | null;
  currentCustomer: Customer | null;
  industries: IndustryMaster[];
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  error: string | null;

  // アクション
  fetchCustomers: (params?: Partial<CustomerSearchQuery>) => Promise<void>;
  fetchCustomer: (id: number) => Promise<void>;
  fetchIndustries: () => Promise<void>;
  createCustomer: (data: CreateCustomerRequest) => Promise<Customer>;
  updateCustomer: (
    id: number,
    data: UpdateCustomerRequest
  ) => Promise<Customer>;
  deleteCustomer: (id: number) => Promise<void>;
  clearCurrentCustomer: () => void;
  clearError: () => void;
};

export const useCustomerStore = create<CustomerState>()((set, _get) => ({
  // 初期状態
  customers: null,
  currentCustomer: null,
  industries: [],
  isLoading: false,
  isSaving: false,
  isDeleting: false,
  error: null,

  // 顧客一覧を取得
  fetchCustomers: async (params?: Partial<CustomerSearchQuery>) => {
    set({ isLoading: true, error: null });

    try {
      const result = await customersApi.getCustomers(params);
      set({ customers: result, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '顧客一覧の取得に失敗しました';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  // 顧客詳細を取得
  fetchCustomer: async (id: number) => {
    set({ isLoading: true, error: null });

    try {
      const customer = await customersApi.getCustomer(id);
      set({ currentCustomer: customer, isLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '顧客情報の取得に失敗しました';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  // 業種一覧を取得
  fetchIndustries: async () => {
    try {
      const industries = await mastersApi.getIndustries();
      set({ industries });
    } catch (error) {
      // 業種取得エラーは致命的ではないので、エラーログのみ
      console.error('Failed to fetch industries:', error);
    }
  },

  // 顧客を作成
  createCustomer: async (data: CreateCustomerRequest) => {
    set({ isSaving: true, error: null });

    try {
      const customer = await customersApi.createCustomer(data);
      set({ isSaving: false });
      return customer;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '顧客の登録に失敗しました';
      set({ isSaving: false, error: message });
      throw error;
    }
  },

  // 顧客を更新
  updateCustomer: async (id: number, data: UpdateCustomerRequest) => {
    set({ isSaving: true, error: null });

    try {
      const customer = await customersApi.updateCustomer(id, data);
      set({ currentCustomer: customer, isSaving: false });
      return customer;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '顧客の更新に失敗しました';
      set({ isSaving: false, error: message });
      throw error;
    }
  },

  // 顧客を削除
  deleteCustomer: async (id: number) => {
    set({ isDeleting: true, error: null });

    try {
      await customersApi.deleteCustomer(id);
      set({ isDeleting: false, currentCustomer: null });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '顧客の削除に失敗しました';
      set({ isDeleting: false, error: message });
      throw error;
    }
  },

  // 現在の顧客をクリア
  clearCurrentCustomer: () => {
    set({ currentCustomer: null });
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));

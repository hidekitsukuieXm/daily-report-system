/**
 * 顧客ストアのテスト
 */

import { act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// APIモック
vi.mock('@/lib/api/customers', () => ({
  getCustomers: vi.fn(),
  getCustomer: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
}));

import * as customersApi from '@/lib/api/customers';
import type { Customer, PaginatedList } from '@/schemas/data';

import { useCustomersStore } from './customers';

// モックのカスタマーデータ
const mockCustomer: Customer = {
  id: 1,
  name: '株式会社ABC',
  address: '東京都渋谷区',
  phone: '03-1234-5678',
  industry: 'IT・通信',
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockPaginatedCustomers: PaginatedList<Customer> = {
  items: [mockCustomer],
  pagination: {
    currentPage: 1,
    perPage: 20,
    totalPages: 1,
    totalCount: 1,
  },
};

describe('useCustomersStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useCustomersStore.setState({
      customers: [],
      selectedCustomer: null,
      pagination: null,
      searchQuery: {},
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  describe('fetchCustomers', () => {
    it('顧客一覧を取得できる', async () => {
      vi.mocked(customersApi.getCustomers).mockResolvedValue(
        mockPaginatedCustomers
      );

      const { fetchCustomers } = useCustomersStore.getState();

      await act(async () => {
        await fetchCustomers();
      });

      const state = useCustomersStore.getState();
      expect(state.customers).toEqual(mockPaginatedCustomers.items);
      expect(state.pagination).toEqual(mockPaginatedCustomers.pagination);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('検索クエリを使用して顧客一覧を取得できる', async () => {
      vi.mocked(customersApi.getCustomers).mockResolvedValue(
        mockPaginatedCustomers
      );

      const { fetchCustomers } = useCustomersStore.getState();
      const query = { name: 'ABC', industry: 'IT・通信' };

      await act(async () => {
        await fetchCustomers(query);
      });

      expect(customersApi.getCustomers).toHaveBeenCalledWith(query);
      const state = useCustomersStore.getState();
      expect(state.searchQuery).toEqual(query);
    });

    it('エラー時にエラーメッセージを設定する', async () => {
      const errorMessage = '顧客一覧の取得に失敗しました';
      vi.mocked(customersApi.getCustomers).mockRejectedValue(
        new Error(errorMessage)
      );

      const { fetchCustomers } = useCustomersStore.getState();

      await expect(
        act(async () => {
          await fetchCustomers();
        })
      ).rejects.toThrow(errorMessage);

      const state = useCustomersStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('fetchCustomer', () => {
    it('顧客詳細を取得できる', async () => {
      vi.mocked(customersApi.getCustomer).mockResolvedValue(mockCustomer);

      const { fetchCustomer } = useCustomersStore.getState();

      await act(async () => {
        await fetchCustomer(1);
      });

      const state = useCustomersStore.getState();
      expect(state.selectedCustomer).toEqual(mockCustomer);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('createCustomer', () => {
    it('顧客を作成できる', async () => {
      vi.mocked(customersApi.createCustomer).mockResolvedValue(mockCustomer);

      const { createCustomer } = useCustomersStore.getState();
      const data = {
        name: '株式会社ABC',
        address: '東京都渋谷区',
        phone: '03-1234-5678',
        industry: 'IT・通信',
      };

      let result: Customer | undefined;
      await act(async () => {
        result = await createCustomer(data);
      });

      expect(result).toEqual(mockCustomer);
      const state = useCustomersStore.getState();
      expect(state.customers).toContainEqual(mockCustomer);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('updateCustomer', () => {
    it('顧客を更新できる', async () => {
      const updatedCustomer = { ...mockCustomer, name: '株式会社XYZ' };
      vi.mocked(customersApi.updateCustomer).mockResolvedValue(updatedCustomer);

      // 初期状態を設定
      useCustomersStore.setState({
        customers: [mockCustomer],
        selectedCustomer: mockCustomer,
      });

      const { updateCustomer } = useCustomersStore.getState();

      let result: Customer | undefined;
      await act(async () => {
        result = await updateCustomer(1, { name: '株式会社XYZ' });
      });

      expect(result).toEqual(updatedCustomer);
      const state = useCustomersStore.getState();
      expect(state.customers[0]).toEqual(updatedCustomer);
      expect(state.selectedCustomer).toEqual(updatedCustomer);
    });
  });

  describe('deleteCustomer', () => {
    it('顧客を論理削除できる', async () => {
      vi.mocked(customersApi.deleteCustomer).mockResolvedValue(undefined);

      // 初期状態を設定
      useCustomersStore.setState({
        customers: [mockCustomer],
        selectedCustomer: mockCustomer,
      });

      const { deleteCustomer } = useCustomersStore.getState();

      await act(async () => {
        await deleteCustomer(1);
      });

      const state = useCustomersStore.getState();
      expect(state.customers[0].isActive).toBe(false);
      expect(state.selectedCustomer?.isActive).toBe(false);
    });
  });

  describe('setSearchQuery', () => {
    it('検索クエリを設定できる', () => {
      const { setSearchQuery } = useCustomersStore.getState();
      const query = { name: 'test', industry: '製造業' };

      act(() => {
        setSearchQuery(query);
      });

      expect(useCustomersStore.getState().searchQuery).toEqual(query);
    });
  });

  describe('clearSelectedCustomer', () => {
    it('選択中の顧客をクリアできる', () => {
      useCustomersStore.setState({ selectedCustomer: mockCustomer });

      const { clearSelectedCustomer } = useCustomersStore.getState();

      act(() => {
        clearSelectedCustomer();
      });

      expect(useCustomersStore.getState().selectedCustomer).toBeNull();
    });
  });

  describe('clearError', () => {
    it('エラーをクリアできる', () => {
      useCustomersStore.setState({ error: 'テストエラー' });

      const { clearError } = useCustomersStore.getState();

      act(() => {
        clearError();
      });

      expect(useCustomersStore.getState().error).toBeNull();
    });
  });
});

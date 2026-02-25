/**
 * 営業担当者ストア
 * Zustandによる営業担当者状態管理
 */

import { create } from 'zustand';

import { extractApiError } from '@/lib/api/client';
import * as salespersonsApi from '@/lib/api/salespersons';
import type { SalespersonSearchQuery } from '@/schemas/api';
import type { Pagination, SalespersonWithRelations } from '@/schemas/data';

type SalespersonState = {
  // 一覧状態
  salespersons: SalespersonWithRelations[];
  pagination: Pagination | null;
  searchQuery: Partial<SalespersonSearchQuery>;

  // UI状態
  isLoading: boolean;
  error: string | null;

  // 一覧アクション
  fetchSalespersons: (query?: Partial<SalespersonSearchQuery>) => Promise<void>;
  setSearchQuery: (query: Partial<SalespersonSearchQuery>) => void;
  clearSalespersons: () => void;

  // エラーアクション
  clearError: () => void;
};

export const useSalespersonStore = create<SalespersonState>()((set, get) => ({
  // 初期状態
  salespersons: [],
  pagination: null,
  searchQuery: {},
  isLoading: false,
  error: null,

  // 営業担当者一覧を取得
  fetchSalespersons: async (query?: Partial<SalespersonSearchQuery>) => {
    set({ isLoading: true, error: null });

    try {
      const mergedQuery = { ...get().searchQuery, ...query };
      const result = await salespersonsApi.getSalespersons(mergedQuery);

      set({
        salespersons: result.items,
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
  setSearchQuery: (query: Partial<SalespersonSearchQuery>) => {
    set({ searchQuery: query });
  },

  // 営業担当者一覧をクリア
  clearSalespersons: () => {
    set({
      salespersons: [],
      pagination: null,
      searchQuery: {},
    });
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));

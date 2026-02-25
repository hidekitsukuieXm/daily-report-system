/**
 * 顧客登録/編集画面のテスト
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAuthStore } from '@/stores/auth';
import { useCustomerStore } from '@/stores/customers';

import { CustomerFormPage } from './CustomerFormPage';

// モックデータ
const mockUser = {
  id: 2,
  name: '鈴木課長',
  email: 'manager@example.com',
  position: { id: 2, name: '課長', level: 2 },
};

const mockCustomer = {
  id: 1,
  name: '株式会社ABC',
  address: '東京都千代田区1-1-1',
  phone: '03-1234-5678',
  industry: 'manufacturing',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockIndustries = [
  { value: 'manufacturing', label: '製造業' },
  { value: 'it', label: 'IT・通信' },
  { value: 'finance', label: '金融・保険' },
];

// ストアのモック
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/stores/customers', () => ({
  useCustomerStore: vi.fn(),
}));

// カスタムレンダリング（ルーティング対応）
function renderWithRouter(
  ui: React.ReactElement,
  { route = '/customers/new' } = {}
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/customers/new" element={ui} />
        <Route path="/customers/:id/edit" element={ui} />
        <Route path="/customers" element={<div>顧客一覧</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('CustomerFormPage', () => {
  const mockFetchCustomer = vi.fn();
  const mockFetchIndustries = vi.fn();
  const mockCreateCustomer = vi.fn();
  const mockUpdateCustomer = vi.fn();
  const mockDeleteCustomer = vi.fn();
  const mockClearCurrentCustomer = vi.fn();
  const mockClearError = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Auth ストアのモック
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    } as ReturnType<typeof useAuthStore>);

    // Customer ストアのモック（デフォルト：新規登録モード）
    vi.mocked(useCustomerStore).mockReturnValue({
      currentCustomer: null,
      industries: mockIndustries,
      isLoading: false,
      isSaving: false,
      isDeleting: false,
      error: null,
      fetchCustomer: mockFetchCustomer,
      fetchIndustries: mockFetchIndustries,
      createCustomer: mockCreateCustomer,
      updateCustomer: mockUpdateCustomer,
      deleteCustomer: mockDeleteCustomer,
      clearCurrentCustomer: mockClearCurrentCustomer,
      clearError: mockClearError,
    } as unknown);
  });

  describe('新規登録モード', () => {
    it('顧客登録画面が表示される', () => {
      renderWithRouter(<CustomerFormPage />);

      expect(screen.getByText('顧客登録')).toBeInTheDocument();
      expect(screen.getByLabelText(/顧客名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/業種/)).toBeInTheDocument();
      expect(screen.getByLabelText(/住所/)).toBeInTheDocument();
      expect(screen.getByLabelText(/電話番号/)).toBeInTheDocument();
    });

    it('業種一覧が取得される', () => {
      renderWithRouter(<CustomerFormPage />);

      expect(mockFetchIndustries).toHaveBeenCalled();
    });

    it('顧客名を入力せずに保存するとバリデーションエラーが表示される', async () => {
      renderWithRouter(<CustomerFormPage />);

      const submitButton = screen.getByRole('button', { name: '保存' });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('顧客名を入力してください')
        ).toBeInTheDocument();
      });
    });

    it('正しい入力で顧客が作成される', async () => {
      const user = userEvent.setup();
      mockCreateCustomer.mockResolvedValue({ id: 1, name: 'テスト株式会社' });

      renderWithRouter(<CustomerFormPage />);

      // フォーム入力
      await user.type(screen.getByLabelText(/顧客名/), 'テスト株式会社');
      await user.selectOptions(screen.getByLabelText(/業種/), 'manufacturing');
      await user.type(screen.getByLabelText(/住所/), '東京都新宿区1-2-3');
      await user.type(screen.getByLabelText(/電話番号/), '03-9999-8888');

      // 保存
      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(mockCreateCustomer).toHaveBeenCalledWith({
          name: 'テスト株式会社',
          address: '東京都新宿区1-2-3',
          phone: '03-9999-8888',
          industry: 'manufacturing',
        });
      });
    });

    it('削除ボタンが表示されない（新規登録モード）', () => {
      renderWithRouter(<CustomerFormPage />);

      expect(
        screen.queryByRole('button', { name: '削除' })
      ).not.toBeInTheDocument();
    });
  });

  describe('編集モード', () => {
    beforeEach(() => {
      vi.mocked(useCustomerStore).mockReturnValue({
        currentCustomer: mockCustomer,
        industries: mockIndustries,
        isLoading: false,
        isSaving: false,
        isDeleting: false,
        error: null,
        fetchCustomer: mockFetchCustomer,
        fetchIndustries: mockFetchIndustries,
        createCustomer: mockCreateCustomer,
        updateCustomer: mockUpdateCustomer,
        deleteCustomer: mockDeleteCustomer,
        clearCurrentCustomer: mockClearCurrentCustomer,
        clearError: mockClearError,
      } as unknown);
    });

    it('顧客編集画面が表示される', () => {
      renderWithRouter(<CustomerFormPage />, { route: '/customers/1/edit' });

      expect(screen.getByText('顧客編集')).toBeInTheDocument();
    });

    it('既存の顧客データがフォームに反映される', () => {
      renderWithRouter(<CustomerFormPage />, { route: '/customers/1/edit' });

      expect(screen.getByLabelText(/顧客名/)).toHaveValue('株式会社ABC');
      expect(screen.getByLabelText(/住所/)).toHaveValue('東京都千代田区1-1-1');
      expect(screen.getByLabelText(/電話番号/)).toHaveValue('03-1234-5678');
    });

    it('顧客詳細が取得される', () => {
      renderWithRouter(<CustomerFormPage />, { route: '/customers/1/edit' });

      expect(mockFetchCustomer).toHaveBeenCalledWith(1);
    });

    it('顧客情報を更新できる', async () => {
      const user = userEvent.setup();
      mockUpdateCustomer.mockResolvedValue({
        ...mockCustomer,
        name: '更新後の会社名',
      });

      renderWithRouter(<CustomerFormPage />, { route: '/customers/1/edit' });

      // 顧客名を更新
      const nameInput = screen.getByLabelText(/顧客名/);
      await user.clear(nameInput);
      await user.type(nameInput, '更新後の会社名');

      // 保存
      await user.click(screen.getByRole('button', { name: '保存' }));

      await waitFor(() => {
        expect(mockUpdateCustomer).toHaveBeenCalledWith(
          1,
          expect.objectContaining({
            name: '更新後の会社名',
          })
        );
      });
    });

    it('削除ボタンが表示される（編集モード）', () => {
      renderWithRouter(<CustomerFormPage />, { route: '/customers/1/edit' });

      expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument();
    });

    it('削除確認ダイアログが表示される', async () => {
      const user = userEvent.setup();

      renderWithRouter(<CustomerFormPage />, { route: '/customers/1/edit' });

      await user.click(screen.getByRole('button', { name: '削除' }));

      await waitFor(() => {
        expect(screen.getByText('顧客の削除')).toBeInTheDocument();
        expect(
          screen.getByText(/「株式会社ABC」を削除してもよろしいですか？/)
        ).toBeInTheDocument();
      });
    });

    it('削除確認後に顧客が削除される', async () => {
      const user = userEvent.setup();
      mockDeleteCustomer.mockResolvedValue(undefined);

      renderWithRouter(<CustomerFormPage />, { route: '/customers/1/edit' });

      // 削除ボタンをクリック
      await user.click(screen.getByRole('button', { name: '削除' }));

      // 確認ダイアログの削除するボタンをクリック
      await waitFor(() => {
        expect(screen.getByText('顧客の削除')).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '削除する' }));

      await waitFor(() => {
        expect(mockDeleteCustomer).toHaveBeenCalledWith(1);
      });
    });

    it('有効フラグのチェックボックスが表示される', () => {
      renderWithRouter(<CustomerFormPage />, { route: '/customers/1/edit' });

      expect(screen.getByLabelText(/有効/)).toBeInTheDocument();
      expect(screen.getByLabelText(/有効/)).toBeChecked();
    });
  });

  describe('ローディング状態', () => {
    it('ローディング中はスピナーが表示される', () => {
      vi.mocked(useCustomerStore).mockReturnValue({
        currentCustomer: null,
        industries: [],
        isLoading: true,
        isSaving: false,
        isDeleting: false,
        error: null,
        fetchCustomer: mockFetchCustomer,
        fetchIndustries: mockFetchIndustries,
        createCustomer: mockCreateCustomer,
        updateCustomer: mockUpdateCustomer,
        deleteCustomer: mockDeleteCustomer,
        clearCurrentCustomer: mockClearCurrentCustomer,
        clearError: mockClearError,
      } as unknown);

      renderWithRouter(<CustomerFormPage />, { route: '/customers/1/edit' });

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('保存中はボタンが無効化される', () => {
      vi.mocked(useCustomerStore).mockReturnValue({
        currentCustomer: null,
        industries: mockIndustries,
        isLoading: false,
        isSaving: true,
        isDeleting: false,
        error: null,
        fetchCustomer: mockFetchCustomer,
        fetchIndustries: mockFetchIndustries,
        createCustomer: mockCreateCustomer,
        updateCustomer: mockUpdateCustomer,
        deleteCustomer: mockDeleteCustomer,
        clearCurrentCustomer: mockClearCurrentCustomer,
        clearError: mockClearError,
      } as unknown);

      renderWithRouter(<CustomerFormPage />);

      expect(screen.getByRole('button', { name: '保存中...' })).toBeDisabled();
    });
  });

  describe('エラー表示', () => {
    it('エラーメッセージが表示される', () => {
      vi.mocked(useCustomerStore).mockReturnValue({
        currentCustomer: null,
        industries: mockIndustries,
        isLoading: false,
        isSaving: false,
        isDeleting: false,
        error: '顧客の登録に失敗しました',
        fetchCustomer: mockFetchCustomer,
        fetchIndustries: mockFetchIndustries,
        createCustomer: mockCreateCustomer,
        updateCustomer: mockUpdateCustomer,
        deleteCustomer: mockDeleteCustomer,
        clearCurrentCustomer: mockClearCurrentCustomer,
        clearError: mockClearError,
      } as unknown);

      renderWithRouter(<CustomerFormPage />);

      expect(screen.getByRole('alert')).toHaveTextContent(
        '顧客の登録に失敗しました'
      );
    });

    it('編集モードで顧客が見つからない場合はエラー画面が表示される', () => {
      vi.mocked(useCustomerStore).mockReturnValue({
        currentCustomer: null,
        industries: mockIndustries,
        isLoading: false,
        isSaving: false,
        isDeleting: false,
        error: null,
        fetchCustomer: mockFetchCustomer,
        fetchIndustries: mockFetchIndustries,
        createCustomer: mockCreateCustomer,
        updateCustomer: mockUpdateCustomer,
        deleteCustomer: mockDeleteCustomer,
        clearCurrentCustomer: mockClearCurrentCustomer,
        clearError: mockClearError,
      } as unknown);

      renderWithRouter(<CustomerFormPage />, { route: '/customers/999/edit' });

      expect(screen.getByText('顧客が見つかりません')).toBeInTheDocument();
    });
  });

  describe('キャンセル処理', () => {
    it('キャンセルボタンで一覧に戻れる', async () => {
      const user = userEvent.setup();

      renderWithRouter(<CustomerFormPage />);

      await user.click(screen.getByRole('button', { name: 'キャンセル' }));

      // 入力がないので確認ダイアログなしで遷移
      expect(screen.getByText('顧客一覧')).toBeInTheDocument();
    });
  });
});

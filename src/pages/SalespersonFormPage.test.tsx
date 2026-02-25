/**
 * 営業担当者登録/編集画面のテスト
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { getPositions } from '@/lib/api/masters';
import {
  getSalesperson,
  getSalespersons,
  createSalesperson,
  updateSalesperson,
} from '@/lib/api/salespersons';
import { useAuthStore } from '@/stores/auth';

import { SalespersonFormPage } from './SalespersonFormPage';

// APIモック
vi.mock('@/lib/api/salespersons', () => ({
  getSalesperson: vi.fn(),
  getSalespersons: vi.fn(),
  createSalesperson: vi.fn(),
  updateSalesperson: vi.fn(),
}));

vi.mock('@/lib/api/masters', () => ({
  getPositions: vi.fn(),
}));

// useNavigateをモック
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// APIモジュールをインポート

describe('SalespersonFormPage', () => {
  const mockPositions = [
    { id: 1, name: '担当', level: 1 },
    { id: 2, name: '課長', level: 2 },
    { id: 3, name: '部長', level: 3 },
  ];

  const mockManagers = {
    items: [
      { id: 1, name: '田中 部長', position: { level: 3 } },
      { id: 2, name: '鈴木 課長', position: { level: 2 } },
    ],
    pagination: { currentPage: 1, perPage: 100, totalPages: 1, totalCount: 2 },
  };

  const mockSalesperson = {
    id: 3,
    name: '山田 太郎',
    email: 'yamada@example.com',
    position: { id: 1, name: '担当', level: 1 },
    managerId: 2,
    isActive: true,
  };

  const directorUser = {
    id: 1,
    name: '田中 部長',
    email: 'director@example.com',
    position: { id: 3, name: '部長', level: 3 },
  };

  const staffUser = {
    id: 3,
    name: '山田 太郎',
    email: 'yamada@example.com',
    position: { id: 1, name: '担当', level: 1 },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // デフォルトで部長ユーザーを設定
    useAuthStore.setState({
      user: directorUser,
      accessToken: 'token',
      refreshToken: 'refresh',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    // APIモックのデフォルト設定
    vi.mocked(getPositions).mockResolvedValue(mockPositions);
    vi.mocked(getSalespersons).mockResolvedValue(mockManagers);
    vi.mocked(getSalesperson).mockResolvedValue(mockSalesperson);
    vi.mocked(createSalesperson).mockResolvedValue({ id: 4 });
    vi.mocked(updateSalesperson).mockResolvedValue({ id: 3 });
  });

  const renderNewPage = () => {
    return render(
      <MemoryRouter initialEntries={['/salespersons/new']}>
        <Routes>
          <Route path="/salespersons/new" element={<SalespersonFormPage />} />
          <Route path="/salespersons" element={<div>一覧画面</div>} />
          <Route path="/dashboard" element={<div>ダッシュボード</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  const renderEditPage = (id = 3) => {
    return render(
      <MemoryRouter initialEntries={[`/salespersons/${id}/edit`]}>
        <Routes>
          <Route
            path="/salespersons/:id/edit"
            element={<SalespersonFormPage />}
          />
          <Route path="/salespersons" element={<div>一覧画面</div>} />
          <Route path="/dashboard" element={<div>ダッシュボード</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('新規登録画面', () => {
    it('should render registration form', async () => {
      renderNewPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者登録')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/氏名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/メールアドレス/)).toBeInTheDocument();
      expect(screen.getByLabelText(/初期パスワード/)).toBeInTheDocument();
      expect(screen.getByLabelText(/役職/)).toBeInTheDocument();
      expect(screen.getByLabelText(/上長/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /保存/ })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /キャンセル/ })
      ).toBeInTheDocument();
    });

    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      renderNewPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者登録')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /保存/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('氏名を入力してください')).toBeInTheDocument();
      });
      expect(
        screen.getByText('メールアドレスを入力してください')
      ).toBeInTheDocument();
      expect(
        screen.getByText('パスワードを入力してください')
      ).toBeInTheDocument();
      expect(screen.getByText('役職を選択してください')).toBeInTheDocument();
    });

    it('should show validation error for short password', async () => {
      const user = userEvent.setup();
      renderNewPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者登録')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/氏名/);
      const emailInput = screen.getByLabelText(/メールアドレス/);
      const passwordInput = screen.getByLabelText(/初期パスワード/);

      await user.type(nameInput, 'テスト');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short'); // 8文字未満

      const submitButton = screen.getByRole('button', { name: /保存/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('パスワードは8文字以上で入力してください')
        ).toBeInTheDocument();
      });
    });

    it('should create salesperson on valid submission', async () => {
      const user = userEvent.setup();
      renderNewPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者登録')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/氏名/);
      const emailInput = screen.getByLabelText(/メールアドレス/);
      const passwordInput = screen.getByLabelText(/初期パスワード/);
      const positionSelect = screen.getByLabelText(/役職/);

      await user.type(nameInput, '新規 太郎');
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'password123');
      await user.selectOptions(positionSelect, '1');

      const submitButton = screen.getByRole('button', { name: /保存/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(createSalesperson).toHaveBeenCalledWith({
          name: '新規 太郎',
          email: 'new@example.com',
          password: 'password123',
          position_id: 1,
          manager_id: null,
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/salespersons');
    });

    it('should show error for duplicate email', async () => {
      const user = userEvent.setup();
      vi.mocked(createSalesperson).mockRejectedValue({
        response: {
          data: {
            error: { code: 'DUPLICATE_EMAIL', message: 'メール重複' },
          },
        },
      });

      renderNewPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者登録')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/氏名/);
      const emailInput = screen.getByLabelText(/メールアドレス/);
      const passwordInput = screen.getByLabelText(/初期パスワード/);
      const positionSelect = screen.getByLabelText(/役職/);

      await user.type(nameInput, '新規 太郎');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.selectOptions(positionSelect, '1');

      const submitButton = screen.getByRole('button', { name: /保存/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText('このメールアドレスは既に登録されています')
        ).toBeInTheDocument();
      });
    });

    it('should navigate to list on cancel', async () => {
      const user = userEvent.setup();
      renderNewPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者登録')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /キャンセル/ });
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/salespersons');
    });
  });

  describe('編集画面', () => {
    it('should render edit form with existing data', async () => {
      renderEditPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者編集')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/氏名/)).toHaveValue('山田 太郎');
      expect(screen.getByLabelText(/メールアドレス/)).toHaveValue(
        'yamada@example.com'
      );
      // 編集時はパスワードフィールドは非表示
      expect(screen.queryByLabelText(/初期パスワード/)).not.toBeInTheDocument();
      // パスワードリセットチェックボックスが表示
      expect(screen.getByText('パスワードをリセットする')).toBeInTheDocument();
      // 有効チェックボックスが表示
      expect(screen.getByText('有効')).toBeInTheDocument();
    });

    it('should update salesperson on valid submission', async () => {
      const user = userEvent.setup();
      renderEditPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者編集')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/氏名/);
      await user.clear(nameInput);
      await user.type(nameInput, '山田 次郎');

      const submitButton = screen.getByRole('button', { name: /保存/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(updateSalesperson).toHaveBeenCalledWith(3, {
          name: '山田 次郎',
          email: 'yamada@example.com',
          position_id: 1,
          manager_id: 2,
          is_active: true,
        });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/salespersons');
    });

    it('should include reset_password when checked', async () => {
      const user = userEvent.setup();
      renderEditPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者編集')).toBeInTheDocument();
      });

      const resetCheckbox = screen.getByRole('checkbox', {
        name: /パスワードをリセットする/,
      });
      await user.click(resetCheckbox);

      const submitButton = screen.getByRole('button', { name: /保存/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(updateSalesperson).toHaveBeenCalledWith(
          3,
          expect.objectContaining({
            reset_password: true,
          })
        );
      });
    });

    it('should toggle active status', async () => {
      const user = userEvent.setup();
      renderEditPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者編集')).toBeInTheDocument();
      });

      const activeCheckbox = screen.getByRole('checkbox', { name: /有効/ });
      expect(activeCheckbox).toBeChecked();

      await user.click(activeCheckbox);
      expect(activeCheckbox).not.toBeChecked();

      const submitButton = screen.getByRole('button', { name: /保存/ });
      await user.click(submitButton);

      await waitFor(() => {
        expect(updateSalesperson).toHaveBeenCalledWith(
          3,
          expect.objectContaining({
            is_active: false,
          })
        );
      });
    });
  });

  describe('権限チェック', () => {
    it('should redirect non-director users to dashboard', async () => {
      useAuthStore.setState({ user: staffUser });

      renderNewPage();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should allow director to access the page', async () => {
      renderNewPage();

      await waitFor(() => {
        expect(screen.getByText('営業担当者登録')).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('ローディング状態', () => {
    it('should show loading state while fetching data in edit mode', async () => {
      vi.mocked(getSalesperson).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockSalesperson), 100)
          )
      );

      renderEditPage();

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('営業担当者編集')).toBeInTheDocument();
      });
    });

    it('should show error when fetching fails', async () => {
      vi.mocked(getSalesperson).mockRejectedValue(new Error('Failed'));

      renderEditPage();

      await waitFor(() => {
        expect(
          screen.getByText('営業担当者情報の取得に失敗しました')
        ).toBeInTheDocument();
      });
    });
  });
});

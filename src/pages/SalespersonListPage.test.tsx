/**
 * 営業担当者一覧画面テスト
 * SCR-040
 */

import { screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuthStore } from '@/stores/auth';
import { useSalespersonStore } from '@/stores/salespersons';
import { renderWithUser } from '@/test/test-utils';

import { SalespersonListPage } from './SalespersonListPage';

// モックナビゲーション
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('SalespersonListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSalespersonStore.getState().clearSalespersons();
    useSalespersonStore.getState().clearError();
  });

  describe('アクセス制御', () => {
    it('担当者がアクセスした場合、ダッシュボードにリダイレクトされる', async () => {
      // 担当者（level=1）でログイン状態をセット
      useAuthStore.setState({
        user: {
          id: 3,
          name: '山田太郎',
          email: 'yamada@example.com',
          position: { id: 1, name: '担当', level: 1 },
        },
        isAuthenticated: true,
      });

      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('課長がアクセスした場合、画面が表示される', async () => {
      // 課長（level=2）でログイン状態をセット
      useAuthStore.setState({
        user: {
          id: 2,
          name: '鈴木課長',
          email: 'manager@example.com',
          position: { id: 2, name: '課長', level: 2 },
        },
        isAuthenticated: true,
      });

      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: '営業担当者マスタ一覧' })
        ).toBeInTheDocument();
      });
    });

    it('部長がアクセスした場合、画面が表示される', async () => {
      // 部長（level=3）でログイン状態をセット
      useAuthStore.setState({
        user: {
          id: 1,
          name: '田中部長',
          email: 'director@example.com',
          position: { id: 3, name: '部長', level: 3 },
        },
        isAuthenticated: true,
      });

      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: '営業担当者マスタ一覧' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('新規登録ボタンの表示', () => {
    it('課長の場合、新規登録ボタンが表示されない', async () => {
      useAuthStore.setState({
        user: {
          id: 2,
          name: '鈴木課長',
          email: 'manager@example.com',
          position: { id: 2, name: '課長', level: 2 },
        },
        isAuthenticated: true,
      });

      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: '営業担当者マスタ一覧' })
        ).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('button', { name: '新規登録' })
      ).not.toBeInTheDocument();
    });

    it('部長の場合、新規登録ボタンが表示される', async () => {
      useAuthStore.setState({
        user: {
          id: 1,
          name: '田中部長',
          email: 'director@example.com',
          position: { id: 3, name: '部長', level: 3 },
        },
        isAuthenticated: true,
      });

      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: '新規登録' })
        ).toBeInTheDocument();
      });
    });
  });

  describe('一覧表示', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: {
          id: 1,
          name: '田中部長',
          email: 'director@example.com',
          position: { id: 3, name: '部長', level: 3 },
        },
        isAuthenticated: true,
      });
    });

    it('営業担当者一覧が表示される', async () => {
      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(screen.getByText('田中部長')).toBeInTheDocument();
      });

      // 鈴木課長は名前と上長として複数回表示される可能性があるので、getAllByTextを使用
      expect(screen.getAllByText('鈴木課長').length).toBeGreaterThan(0);
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
      expect(screen.getByText('佐藤花子')).toBeInTheDocument();
    });

    it('テーブルのカラムが正しく表示される', async () => {
      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        // テーブルヘッダーの確認（氏名は検索フォームにもあるので、テーブル内のみを確認）
        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
      });

      // テーブルヘッダーが存在することを確認
      const headers = screen.getAllByRole('columnheader');
      const headerTexts = headers.map((h) => h.textContent);
      expect(headerTexts).toContain('氏名');
      expect(headerTexts).toContain('メールアドレス');
      expect(headerTexts).toContain('役職');
      expect(headerTexts).toContain('上長');
      expect(headerTexts).toContain('状態');
      expect(headerTexts).toContain('操作');
    });

    it('有効な担当者は有効バッジが表示される', async () => {
      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        const activeBadges = screen.getAllByText('有効');
        expect(activeBadges.length).toBeGreaterThan(0);
      });
    });

    it('無効な担当者は無効バッジが表示される', async () => {
      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(screen.getByText('無効')).toBeInTheDocument();
      });
    });
  });

  describe('検索機能', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: {
          id: 1,
          name: '田中部長',
          email: 'director@example.com',
          position: { id: 3, name: '部長', level: 3 },
        },
        isAuthenticated: true,
      });
    });

    it('検索条件フォームが表示される', async () => {
      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', { name: '検索条件' })
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText('氏名')).toBeInTheDocument();
      expect(screen.getByLabelText('役職')).toBeInTheDocument();
      expect(screen.getByLabelText('状態')).toBeInTheDocument();
    });

    it('検索ボタンとクリアボタンが表示される', async () => {
      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: '検索' })
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole('button', { name: 'クリア' })
      ).toBeInTheDocument();
    });

    it('氏名で検索できる', async () => {
      const { user } = renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('氏名')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('氏名'), '山田');
      await user.click(screen.getByRole('button', { name: '検索' }));

      await waitFor(() => {
        expect(screen.getByText('山田太郎')).toBeInTheDocument();
      });
    });

    it('クリアボタンで検索条件がリセットされる', async () => {
      const { user } = renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('氏名')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText('氏名'), '山田');
      await user.click(screen.getByRole('button', { name: 'クリア' }));

      expect(screen.getByLabelText('氏名')).toHaveValue('');
    });
  });

  describe('編集機能', () => {
    it('部長の場合、編集ボタンが表示される', async () => {
      useAuthStore.setState({
        user: {
          id: 1,
          name: '田中部長',
          email: 'director@example.com',
          position: { id: 3, name: '部長', level: 3 },
        },
        isAuthenticated: true,
      });

      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: '編集' });
        expect(editButtons.length).toBeGreaterThan(0);
      });
    });

    it('課長の場合、編集ボタンが表示されない', async () => {
      useAuthStore.setState({
        user: {
          id: 2,
          name: '鈴木課長',
          email: 'manager@example.com',
          position: { id: 2, name: '課長', level: 2 },
        },
        isAuthenticated: true,
      });

      renderWithUser(<SalespersonListPage />);

      // 鈴木課長は名前と上長として複数回表示される可能性があるのでgetAllByTextを使用
      await waitFor(() => {
        expect(screen.getAllByText('鈴木課長').length).toBeGreaterThan(0);
      });

      expect(
        screen.queryByRole('button', { name: '編集' })
      ).not.toBeInTheDocument();
    });

    it('編集ボタンをクリックすると編集画面に遷移する', async () => {
      useAuthStore.setState({
        user: {
          id: 1,
          name: '田中部長',
          email: 'director@example.com',
          position: { id: 3, name: '部長', level: 3 },
        },
        isAuthenticated: true,
      });

      const { user } = renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: '編集' });
        expect(editButtons.length).toBeGreaterThan(0);
      });

      const editButtons = screen.getAllByRole('button', { name: '編集' });
      await user.click(editButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/salespersons/1/edit');
    });

    it('新規登録ボタンをクリックすると登録画面に遷移する', async () => {
      useAuthStore.setState({
        user: {
          id: 1,
          name: '田中部長',
          email: 'director@example.com',
          position: { id: 3, name: '部長', level: 3 },
        },
        isAuthenticated: true,
      });

      const { user } = renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: '新規登録' })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: '新規登録' }));

      expect(mockNavigate).toHaveBeenCalledWith('/salespersons/new');
    });
  });

  describe('検索結果件数', () => {
    it('検索結果件数が表示される', async () => {
      useAuthStore.setState({
        user: {
          id: 1,
          name: '田中部長',
          email: 'director@example.com',
          position: { id: 3, name: '部長', level: 3 },
        },
        isAuthenticated: true,
      });

      renderWithUser(<SalespersonListPage />);

      await waitFor(() => {
        expect(screen.getByText(/検索結果:/)).toBeInTheDocument();
      });
    });
  });
});

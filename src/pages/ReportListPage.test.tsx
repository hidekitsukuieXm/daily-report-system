/**
 * 日報一覧画面のテスト
 * SCR-010
 *
 * 受け入れ基準:
 * - 日報一覧が表示される
 * - フィルタリングが動作する
 * - ページネーションが動作する
 * - ステータスがバッジで表示される
 * - 詳細画面へ遷移できる
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuthStore } from '@/stores/auth';
import { useReportStore } from '@/stores/reports';

import { ReportListPage } from './ReportListPage';

// useNavigateをモック
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// テストデータ
const mockReports = [
  {
    id: 1,
    reportDate: new Date('2024-01-15'),
    status: 'submitted' as const,
    salesperson: { id: 1, name: '山田太郎' },
    visitCount: 3,
    submittedAt: new Date('2024-01-15T18:00:00Z'),
    createdAt: new Date('2024-01-15T17:00:00Z'),
    updatedAt: new Date('2024-01-15T18:00:00Z'),
  },
  {
    id: 2,
    reportDate: new Date('2024-01-14'),
    status: 'approved' as const,
    salesperson: { id: 1, name: '山田太郎' },
    visitCount: 2,
    submittedAt: new Date('2024-01-14T18:00:00Z'),
    createdAt: new Date('2024-01-14T17:00:00Z'),
    updatedAt: new Date('2024-01-14T19:00:00Z'),
  },
  {
    id: 3,
    reportDate: new Date('2024-01-16'),
    status: 'draft' as const,
    salesperson: { id: 1, name: '山田太郎' },
    visitCount: 0,
    submittedAt: null,
    createdAt: new Date('2024-01-16T10:00:00Z'),
    updatedAt: new Date('2024-01-16T10:00:00Z'),
  },
];

const mockPagination = {
  currentPage: 1,
  perPage: 20,
  totalPages: 1,
  totalCount: 3,
};

describe('ReportListPage', () => {
  const mockFetchReports = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    // モックをリセット
    mockFetchReports.mockClear();
    mockClearError.mockClear();
    mockNavigate.mockClear();

    // 認証ストアを設定（担当者レベル）
    useAuthStore.setState({
      user: {
        id: 1,
        name: '山田太郎',
        email: 'yamada@example.com',
        position: { id: 1, name: '担当', level: 1 },
      },
      accessToken: 'mock-token',
      refreshToken: 'mock-refresh-token',
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });

    // 日報ストアを設定
    useReportStore.setState({
      reports: mockReports,
      pagination: mockPagination,
      searchQuery: {},
      currentReport: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
      fetchReports: mockFetchReports,
      clearError: mockClearError,
    });
  });

  const renderReportListPage = () => {
    return render(
      <MemoryRouter>
        <ReportListPage />
      </MemoryRouter>
    );
  };

  describe('日報一覧の表示', () => {
    it('ページタイトルが表示される', () => {
      renderReportListPage();

      expect(
        screen.getByRole('heading', { name: '日報一覧' })
      ).toBeInTheDocument();
    });

    it('日報一覧テーブルが表示される', () => {
      renderReportListPage();

      // テーブルが存在することを確認
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // テーブルヘッダー（within を使ってテーブル内に限定）
      expect(within(table).getByText('報告日')).toBeInTheDocument();
      expect(within(table).getByText('担当者')).toBeInTheDocument();
      expect(within(table).getByText('訪問件数')).toBeInTheDocument();
      expect(within(table).getByText('ステータス')).toBeInTheDocument();
      expect(within(table).getByText('操作')).toBeInTheDocument();
    });

    it('日報データが正しく表示される', () => {
      renderReportListPage();

      // 担当者名
      expect(screen.getAllByText('山田太郎')).toHaveLength(3);
      // 訪問件数
      expect(screen.getByText('3件')).toBeInTheDocument();
      expect(screen.getByText('2件')).toBeInTheDocument();
      expect(screen.getByText('0件')).toBeInTheDocument();
    });

    it('初期読み込み時にfetchReportsが呼ばれる', () => {
      renderReportListPage();

      expect(mockFetchReports).toHaveBeenCalledTimes(1);
    });

    it('検索結果の件数が表示される', () => {
      renderReportListPage();

      expect(screen.getByText('検索結果: 3件')).toBeInTheDocument();
    });

    it('日報が空の場合にメッセージが表示される', () => {
      useReportStore.setState({
        reports: [],
        pagination: { ...mockPagination, totalCount: 0 },
      });

      renderReportListPage();

      expect(screen.getByText('日報がありません')).toBeInTheDocument();
    });

    it('ローディング中はローディングメッセージが表示される', () => {
      useReportStore.setState({
        isLoading: true,
      });

      renderReportListPage();

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('エラーがある場合にエラーメッセージが表示される', () => {
      useReportStore.setState({
        error: '日報の取得に失敗しました',
      });

      renderReportListPage();

      expect(screen.getByRole('alert')).toHaveTextContent(
        '日報の取得に失敗しました'
      );
    });
  });

  describe('ステータスバッジの表示', () => {
    it('各ステータスが正しいラベルで表示される', () => {
      renderReportListPage();

      // テーブル内のステータスバッジを確認（セレクトのオプションと区別するため）
      const table = screen.getByRole('table');
      const statusBadges = within(table).getAllByText(/提出済|承認完了|下書き/);
      expect(statusBadges).toHaveLength(3);
    });

    it('ステータスバッジに適切なCSSクラスが設定される', () => {
      renderReportListPage();

      // クラスセレクタを使ってバッジ要素を取得
      const table = screen.getByRole('table');
      const submittedBadge = within(table).getByText('提出済');
      expect(submittedBadge).toHaveClass('status-badge', 'status-submitted');

      const approvedBadge = within(table).getByText('承認完了');
      expect(approvedBadge).toHaveClass('status-badge', 'status-approved');

      const draftBadge = within(table).getByText('下書き');
      expect(draftBadge).toHaveClass('status-badge', 'status-draft');
    });
  });

  describe('フィルタリング機能', () => {
    it('検索フォームが表示される', () => {
      renderReportListPage();

      // 期間フィールド（日付入力）
      expect(screen.getByLabelText('期間')).toBeInTheDocument();
      // ステータスセレクト（comboboxロールで取得）
      expect(
        screen.getByRole('combobox', { name: 'ステータス' })
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '検索' })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: 'クリア' })
      ).toBeInTheDocument();
    });

    it('日付範囲で検索できる', async () => {
      const user = userEvent.setup();
      renderReportListPage();

      // 日付入力フィールドを取得（labelの関連付けで取得）
      const dateFromInput = screen.getByLabelText('期間');

      // 日付入力はtype="date"なのでclear後に入力
      await user.clear(dateFromInput);
      await user.type(dateFromInput, '2024-01-01');

      const searchButton = screen.getByRole('button', { name: '検索' });
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockFetchReports).toHaveBeenLastCalledWith(
          expect.objectContaining({
            page: 1,
            date_from: '2024-01-01',
          })
        );
      });
    });

    it('ステータスで検索できる', async () => {
      const user = userEvent.setup();
      renderReportListPage();

      const statusSelect = screen.getByRole('combobox', { name: 'ステータス' });
      await user.selectOptions(statusSelect, 'submitted');

      const searchButton = screen.getByRole('button', { name: '検索' });
      await user.click(searchButton);

      await waitFor(() => {
        expect(mockFetchReports).toHaveBeenLastCalledWith(
          expect.objectContaining({
            page: 1,
            status: 'submitted',
          })
        );
      });
    });

    it('クリアボタンで検索条件がリセットされる', async () => {
      const user = userEvent.setup();
      renderReportListPage();

      const statusSelect = screen.getByRole('combobox', { name: 'ステータス' });
      await user.selectOptions(statusSelect, 'submitted');

      const clearButton = screen.getByRole('button', { name: 'クリア' });
      await user.click(clearButton);

      expect(statusSelect).toHaveValue('');
      expect(mockFetchReports).toHaveBeenLastCalledWith({ page: 1 });
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  describe('ページネーション', () => {
    it('複数ページある場合にページネーションが表示される', () => {
      useReportStore.setState({
        pagination: {
          currentPage: 1,
          perPage: 20,
          totalPages: 3,
          totalCount: 50,
        },
      });

      renderReportListPage();

      expect(screen.getByText('1 / 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /前へ/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /次へ/i })).toBeInTheDocument();
    });

    it('1ページのみの場合はページネーションが表示されない', () => {
      renderReportListPage();

      expect(screen.queryByText('1 / 1')).not.toBeInTheDocument();
    });

    it('次へボタンでページ遷移できる', async () => {
      const user = userEvent.setup();
      useReportStore.setState({
        pagination: {
          currentPage: 1,
          perPage: 20,
          totalPages: 3,
          totalCount: 50,
        },
      });

      renderReportListPage();

      const nextButton = screen.getByRole('button', { name: /次へ/i });
      await user.click(nextButton);

      expect(mockFetchReports).toHaveBeenLastCalledWith({ page: 2 });
    });

    it('前へボタンでページ遷移できる', async () => {
      const user = userEvent.setup();
      useReportStore.setState({
        pagination: {
          currentPage: 2,
          perPage: 20,
          totalPages: 3,
          totalCount: 50,
        },
      });

      renderReportListPage();

      const prevButton = screen.getByRole('button', { name: /前へ/i });
      await user.click(prevButton);

      expect(mockFetchReports).toHaveBeenLastCalledWith({ page: 1 });
    });

    it('最初のページでは前へボタンが無効', () => {
      useReportStore.setState({
        pagination: {
          currentPage: 1,
          perPage: 20,
          totalPages: 3,
          totalCount: 50,
        },
      });

      renderReportListPage();

      const prevButton = screen.getByRole('button', { name: /前へ/i });
      expect(prevButton).toBeDisabled();
    });

    it('最後のページでは次へボタンが無効', () => {
      useReportStore.setState({
        pagination: {
          currentPage: 3,
          perPage: 20,
          totalPages: 3,
          totalCount: 50,
        },
      });

      renderReportListPage();

      const nextButton = screen.getByRole('button', { name: /次へ/i });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('詳細画面への遷移', () => {
    it('詳細ボタンをクリックすると詳細画面に遷移する', async () => {
      const user = userEvent.setup();
      renderReportListPage();

      const detailButtons = screen.getAllByRole('button', { name: '詳細' });
      await user.click(detailButtons[0]);

      expect(mockNavigate).toHaveBeenCalledWith('/reports/1');
    });

    it('各日報の詳細ボタンが正しいIDで遷移する', async () => {
      const user = userEvent.setup();
      renderReportListPage();

      const detailButtons = screen.getAllByRole('button', { name: '詳細' });

      // 2番目の日報（id: 2）の詳細ボタンをクリック
      await user.click(detailButtons[1]);

      expect(mockNavigate).toHaveBeenCalledWith('/reports/2');
    });
  });

  describe('新規作成ボタン', () => {
    it('担当者の場合は新規作成ボタンが表示される', () => {
      renderReportListPage();

      expect(
        screen.getByRole('button', { name: '新規作成' })
      ).toBeInTheDocument();
    });

    it('上長（課長）の場合は新規作成ボタンが表示されない', () => {
      useAuthStore.setState({
        user: {
          id: 2,
          name: '鈴木課長',
          email: 'suzuki@example.com',
          position: { id: 2, name: '課長', level: 2 },
        },
      });

      renderReportListPage();

      expect(
        screen.queryByRole('button', { name: '新規作成' })
      ).not.toBeInTheDocument();
    });

    it('上長（部長）の場合は新規作成ボタンが表示されない', () => {
      useAuthStore.setState({
        user: {
          id: 3,
          name: '田中部長',
          email: 'tanaka@example.com',
          position: { id: 3, name: '部長', level: 3 },
        },
      });

      renderReportListPage();

      expect(
        screen.queryByRole('button', { name: '新規作成' })
      ).not.toBeInTheDocument();
    });

    it('新規作成ボタンをクリックすると作成画面に遷移する', async () => {
      const user = userEvent.setup();
      renderReportListPage();

      const createButton = screen.getByRole('button', { name: '新規作成' });
      await user.click(createButton);

      expect(mockNavigate).toHaveBeenCalledWith('/reports/new');
    });
  });

  describe('ローディング状態での操作', () => {
    it('ローディング中は検索ボタンが無効になる', () => {
      useReportStore.setState({
        isLoading: true,
      });

      renderReportListPage();

      const searchButton = screen.getByRole('button', { name: '検索' });
      expect(searchButton).toBeDisabled();
    });

    it('ローディング中はクリアボタンが無効になる', () => {
      useReportStore.setState({
        isLoading: true,
      });

      renderReportListPage();

      const clearButton = screen.getByRole('button', { name: 'クリア' });
      expect(clearButton).toBeDisabled();
    });
  });
});

/**
 * ダッシュボード画面のテスト
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuthStore } from '@/stores/auth';

import { DashboardPage } from './DashboardPage';

// QueryClientの設定
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

// テスト用ラッパー
function TestWrapper({ children }: { children: React.ReactNode }) {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

// API モック
vi.mock('@/hooks/useDashboard', () => ({
  useDashboardSummary: vi.fn(() => ({
    data: { visitCount: 15, reportCount: 5, pendingApprovalCount: 3 },
    isLoading: false,
  })),
  useRecentReports: vi.fn(() => ({
    data: [
      {
        id: 1,
        reportDate: '2024-01-15',
        status: 'submitted',
        salesperson: { id: 1, name: '山田太郎' },
        visitCount: 3,
      },
      {
        id: 2,
        reportDate: '2024-01-14',
        status: 'approved',
        salesperson: { id: 1, name: '山田太郎' },
        visitCount: 2,
      },
    ],
    isLoading: false,
  })),
  usePendingApprovals: vi.fn(() => ({
    data: [
      {
        id: 3,
        reportDate: '2024-01-16',
        status: 'submitted',
        salesperson: { id: 2, name: '佐藤花子' },
        visitCount: 4,
      },
    ],
    isLoading: false,
  })),
}));

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('担当者としてログイン時', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: {
          id: 1,
          name: '山田太郎',
          email: 'yamada@example.com',
          position: { id: 1, name: '担当', level: 1 },
        },
        isAuthenticated: true,
      });
    });

    it('ウェルカムメッセージが表示される', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.getByText(/ようこそ、山田太郎さん/)).toBeInTheDocument();
    });

    it('サマリー情報が表示される', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('今月の訪問件数')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('今月の日報作成数')).toBeInTheDocument();
    });

    it('新規日報作成ボタンが表示される（担当者のみ）', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.getByText('新規日報作成')).toBeInTheDocument();
    });

    it('直近の日報が表示される', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.getByText('直近の日報')).toBeInTheDocument();
    });

    it('承認待ち一覧は表示されない（担当者には非表示）', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.queryByText('承認待ち一覧')).not.toBeInTheDocument();
    });

    it('承認待ち件数は表示されない（担当者には非表示）', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.queryByText('承認待ち件数')).not.toBeInTheDocument();
    });
  });

  describe('課長としてログイン時', () => {
    beforeEach(() => {
      useAuthStore.setState({
        user: {
          id: 2,
          name: '鈴木課長',
          email: 'suzuki@example.com',
          position: { id: 2, name: '課長', level: 2 },
        },
        isAuthenticated: true,
      });
    });

    it('新規日報作成ボタンは表示されない（上長には非表示）', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.queryByText('新規日報作成')).not.toBeInTheDocument();
    });

    it('承認待ち一覧が表示される', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.getByText('承認待ち一覧')).toBeInTheDocument();
    });

    it('承認待ち件数が表示される', () => {
      render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('承認待ち件数')).toBeInTheDocument();
    });
  });
});

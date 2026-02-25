/**
 * 日報詳細画面のテスト
 * SCR-013
 *
 * 受け入れ基準:
 * - 日報詳細が表示される
 * - 訪問記録が一覧表示される
 * - 承認履歴が表示される
 * - コメントの表示ができる
 * - ステータスに応じたアクションが表示される
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuthStore } from '@/stores/auth';
import { useReportStore } from '@/stores/reports';

import { ReportDetailPage } from './ReportDetailPage';

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
const mockReportDetail = {
  id: 1,
  salespersonId: 1,
  reportDate: new Date('2024-01-15'),
  problem: '競合他社の価格攻勢が激しい',
  plan: 'ABC社への見積書作成',
  status: 'submitted' as const,
  submittedAt: new Date('2024-01-15T18:00:00Z'),
  managerApprovedAt: null,
  directorApprovedAt: null,
  createdAt: new Date('2024-01-15T17:00:00Z'),
  updatedAt: new Date('2024-01-15T18:00:00Z'),
  salesperson: {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    positionId: 1,
    managerId: 2,
    directorId: 3,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    position: { id: 1, name: '担当', level: 1, createdAt: new Date(), updatedAt: new Date() },
  },
  visitRecords: [
    {
      id: 1,
      dailyReportId: 1,
      customerId: 1,
      visitTime: new Date('2024-01-15T10:00:00Z'),
      content: '新商品の提案を実施。担当者は興味を示しており、次回見積提示予定。',
      result: 'negotiating' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: 1, name: '株式会社ABC' },
      attachments: [
        {
          id: 1,
          visitRecordId: 1,
          fileName: 'proposal.pdf',
          filePath: '/uploads/proposal.pdf',
          contentType: 'application/pdf',
          fileSize: 1024000,
          createdAt: new Date(),
        },
      ],
    },
    {
      id: 2,
      dailyReportId: 1,
      customerId: 2,
      visitTime: new Date('2024-01-15T14:00:00Z'),
      content: '定期訪問。特に問題なし。',
      result: 'information_gathering' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: 2, name: '株式会社XYZ' },
      attachments: [],
    },
  ],
  approvalHistories: [
    {
      id: 1,
      dailyReportId: 1,
      approverId: 2,
      action: 'approved' as const,
      comment: '良い提案ですね',
      approvalLevel: 'manager' as const,
      createdAt: new Date('2024-01-15T19:00:00Z'),
      approver: { id: 2, name: '鈴木課長' },
    },
  ],
  comments: [
    {
      id: 1,
      dailyReportId: 1,
      commenterId: 2,
      content: 'ABC社の件、良い感触ですね。見積は明日中に確認します。',
      createdAt: new Date('2024-01-15T19:05:00Z'),
      updatedAt: new Date('2024-01-15T19:05:00Z'),
      commenter: { id: 2, name: '鈴木課長' },
    },
  ],
};

describe('ReportDetailPage', () => {
  const mockFetchReport = vi.fn();
  const mockClearCurrentReport = vi.fn();

  beforeEach(() => {
    // モックをリセット
    mockFetchReport.mockClear();
    mockClearCurrentReport.mockClear();
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
      reports: [],
      pagination: null,
      searchQuery: {},
      currentReport: mockReportDetail,
      isLoading: false,
      isSubmitting: false,
      error: null,
      fetchReport: mockFetchReport,
      clearCurrentReport: mockClearCurrentReport,
    });
  });

  const renderReportDetailPage = (reportId = '1') => {
    return render(
      <MemoryRouter initialEntries={[`/reports/${reportId}`]}>
        <Routes>
          <Route path="/reports/:id" element={<ReportDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('基本情報の表示', () => {
    it('ページタイトルが表示される', () => {
      renderReportDetailPage();

      expect(
        screen.getByRole('heading', { name: '日報詳細' })
      ).toBeInTheDocument();
    });

    it('報告日が表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText('報告日')).toBeInTheDocument();
    });

    it('担当者名が表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText('担当者')).toBeInTheDocument();
      expect(screen.getByText('山田太郎')).toBeInTheDocument();
    });

    it('ステータスが表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText('ステータス')).toBeInTheDocument();
      expect(screen.getByText('提出済')).toBeInTheDocument();
    });

    it('提出日時が表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText('提出日時')).toBeInTheDocument();
    });

    it('初期読み込み時にfetchReportが呼ばれる', () => {
      renderReportDetailPage();

      expect(mockFetchReport).toHaveBeenCalledTimes(1);
      expect(mockFetchReport).toHaveBeenCalledWith(1);
    });

    it('ローディング中はローディングメッセージが表示される', () => {
      useReportStore.setState({
        currentReport: null,
        isLoading: true,
      });

      renderReportDetailPage();

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });

    it('日報が見つからない場合はメッセージが表示される', () => {
      useReportStore.setState({
        currentReport: null,
        isLoading: false,
      });

      renderReportDetailPage();

      expect(screen.getByText('日報が見つかりません')).toBeInTheDocument();
    });

    it('エラーがある場合にエラーメッセージが表示される', () => {
      useReportStore.setState({
        error: '日報の取得に失敗しました',
      });

      renderReportDetailPage();

      expect(screen.getByRole('alert')).toHaveTextContent(
        '日報の取得に失敗しました'
      );
    });
  });

  describe('訪問記録の表示', () => {
    it('訪問記録セクションが表示される', () => {
      renderReportDetailPage();

      expect(
        screen.getByRole('heading', { name: '訪問記録' })
      ).toBeInTheDocument();
    });

    it('訪問記録が一覧表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText('株式会社ABC')).toBeInTheDocument();
      expect(screen.getByText('株式会社XYZ')).toBeInTheDocument();
    });

    it('訪問内容が表示される', () => {
      renderReportDetailPage();

      expect(
        screen.getByText(/新商品の提案を実施/)
      ).toBeInTheDocument();
      expect(screen.getByText(/定期訪問/)).toBeInTheDocument();
    });

    it('訪問結果が表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText('結果: 商談中')).toBeInTheDocument();
      expect(screen.getByText('結果: 情報収集')).toBeInTheDocument();
    });

    it('添付ファイルが表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText('proposal.pdf')).toBeInTheDocument();
    });

    it('添付ファイルのサイズが表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText(/1000\.0 KB/)).toBeInTheDocument();
    });

    it('訪問記録がない場合はメッセージが表示される', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          visitRecords: [],
        },
      });

      renderReportDetailPage();

      expect(screen.getByText('訪問記録がありません')).toBeInTheDocument();
    });
  });

  describe('Problem/Planの表示', () => {
    it('課題・相談セクションが表示される', () => {
      renderReportDetailPage();

      expect(
        screen.getByRole('heading', { name: /課題・相談/ })
      ).toBeInTheDocument();
    });

    it('課題・相談内容が表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText('競合他社の価格攻勢が激しい')).toBeInTheDocument();
    });

    it('明日やることセクションが表示される', () => {
      renderReportDetailPage();

      expect(
        screen.getByRole('heading', { name: /明日やること/ })
      ).toBeInTheDocument();
    });

    it('明日やること内容が表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText('ABC社への見積書作成')).toBeInTheDocument();
    });

    it('課題・相談が未入力の場合は「記載なし」と表示される', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          problem: null,
        },
      });

      renderReportDetailPage();

      expect(screen.getAllByText('記載なし')).toHaveLength(1);
    });
  });

  describe('承認履歴の表示', () => {
    it('承認履歴セクションが表示される', () => {
      renderReportDetailPage();

      expect(
        screen.getByRole('heading', { name: '承認履歴' })
      ).toBeInTheDocument();
    });

    it('承認履歴が時系列で表示される', () => {
      renderReportDetailPage();

      // 鈴木課長は承認履歴とコメント両方に表示されるのでgetAllByTextを使用
      const approverElements = screen.getAllByText('鈴木課長');
      expect(approverElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('承認')).toBeInTheDocument();
    });

    it('承認コメントが表示される', () => {
      renderReportDetailPage();

      expect(screen.getByText('良い提案ですね')).toBeInTheDocument();
    });

    it('承認履歴がない場合はセクションが表示されない', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          approvalHistories: [],
        },
      });

      renderReportDetailPage();

      expect(
        screen.queryByRole('heading', { name: '承認履歴' })
      ).not.toBeInTheDocument();
    });
  });

  describe('コメントの表示', () => {
    it('コメントセクションが表示される', () => {
      renderReportDetailPage();

      expect(
        screen.getByRole('heading', { name: 'コメント' })
      ).toBeInTheDocument();
    });

    it('コメントが時系列で表示される', () => {
      renderReportDetailPage();

      expect(
        screen.getByText(/ABC社の件、良い感触ですね/)
      ).toBeInTheDocument();
    });

    it('コメント投稿者が表示される', () => {
      renderReportDetailPage();

      // コメントセクション内のコメント投稿者
      const commentSection = screen.getByText(/ABC社の件、良い感触ですね/).closest('.comment-item');
      expect(commentSection).toBeInTheDocument();
    });

    it('コメントがない場合はセクションが表示されない', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          comments: [],
        },
      });

      renderReportDetailPage();

      expect(
        screen.queryByRole('heading', { name: 'コメント' })
      ).not.toBeInTheDocument();
    });
  });

  describe('編集ボタンの表示制御（担当者）', () => {
    it('担当者で下書き状態の場合、編集ボタンが表示される', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'draft',
        },
      });

      renderReportDetailPage();

      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
    });

    it('担当者で差戻し状態の場合、編集ボタンが表示される', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'rejected',
        },
      });

      renderReportDetailPage();

      expect(screen.getByRole('button', { name: '編集' })).toBeInTheDocument();
    });

    it('担当者で提出済状態の場合、編集ボタンが非表示', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'submitted',
        },
      });

      renderReportDetailPage();

      expect(
        screen.queryByRole('button', { name: '編集' })
      ).not.toBeInTheDocument();
    });

    it('担当者で承認完了状態の場合、編集ボタンが非表示', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'approved',
        },
      });

      renderReportDetailPage();

      expect(
        screen.queryByRole('button', { name: '編集' })
      ).not.toBeInTheDocument();
    });

    it('他人の日報の場合、編集ボタンが非表示', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'draft',
          salesperson: {
            ...mockReportDetail.salesperson,
            id: 999, // 別の担当者
          },
        },
      });

      renderReportDetailPage();

      expect(
        screen.queryByRole('button', { name: '編集' })
      ).not.toBeInTheDocument();
    });
  });

  describe('承認/差戻しボタンの表示制御（課長）', () => {
    beforeEach(() => {
      // 課長として設定
      useAuthStore.setState({
        user: {
          id: 2,
          name: '鈴木課長',
          email: 'suzuki@example.com',
          position: { id: 2, name: '課長', level: 2 },
        },
      });
    });

    it('課長で提出済状態の場合、承認ボタンが表示される', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'submitted',
        },
      });

      renderReportDetailPage();

      expect(screen.getByRole('button', { name: '承認' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '差戻し' })).toBeInTheDocument();
    });

    it('課長で課長承認済状態の場合、承認ボタンが非表示', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'manager_approved',
        },
      });

      renderReportDetailPage();

      expect(
        screen.queryByRole('button', { name: '承認' })
      ).not.toBeInTheDocument();
    });

    it('課長で下書き状態の場合、承認ボタンが非表示', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'draft',
        },
      });

      renderReportDetailPage();

      expect(
        screen.queryByRole('button', { name: '承認' })
      ).not.toBeInTheDocument();
    });
  });

  describe('承認/差戻しボタンの表示制御（部長）', () => {
    beforeEach(() => {
      // 部長として設定
      useAuthStore.setState({
        user: {
          id: 3,
          name: '田中部長',
          email: 'tanaka@example.com',
          position: { id: 3, name: '部長', level: 3 },
        },
      });
    });

    it('部長で課長承認済状態の場合、承認ボタンが表示される', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'manager_approved',
        },
      });

      renderReportDetailPage();

      expect(screen.getByRole('button', { name: '承認' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '差戻し' })).toBeInTheDocument();
    });

    it('部長で提出済状態の場合、承認ボタンが非表示', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'submitted',
        },
      });

      renderReportDetailPage();

      expect(
        screen.queryByRole('button', { name: '承認' })
      ).not.toBeInTheDocument();
    });

    it('部長で承認完了状態の場合、承認ボタンが非表示', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'approved',
        },
      });

      renderReportDetailPage();

      expect(
        screen.queryByRole('button', { name: '承認' })
      ).not.toBeInTheDocument();
    });
  });

  describe('担当者の場合、承認ボタンは表示されない', () => {
    it('担当者では提出済状態でも承認ボタンが非表示', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'submitted',
        },
      });

      renderReportDetailPage();

      expect(
        screen.queryByRole('button', { name: '承認' })
      ).not.toBeInTheDocument();
    });
  });

  describe('画面遷移', () => {
    it('編集ボタンをクリックすると編集画面に遷移する', async () => {
      const user = userEvent.setup();

      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'draft',
        },
      });

      renderReportDetailPage();

      const editButton = screen.getByRole('button', { name: '編集' });
      await user.click(editButton);

      expect(mockNavigate).toHaveBeenCalledWith('/reports/1/edit');
    });

    it('戻るボタンをクリックすると一覧画面に遷移する', async () => {
      const user = userEvent.setup();
      renderReportDetailPage();

      const backButton = screen.getByRole('button', { name: '戻る' });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/reports');
    });
  });

  describe('ステータスバッジの表示', () => {
    it('下書きステータスが正しく表示される', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'draft',
        },
      });

      renderReportDetailPage();

      const badge = screen.getByText('下書き');
      expect(badge).toHaveClass('status-badge', 'status-draft');
    });

    it('提出済ステータスが正しく表示される', () => {
      renderReportDetailPage();

      const badge = screen.getByText('提出済');
      expect(badge).toHaveClass('status-badge', 'status-submitted');
    });

    it('課長承認済ステータスが正しく表示される', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'manager_approved',
        },
      });

      renderReportDetailPage();

      const badge = screen.getByText('課長承認済');
      expect(badge).toHaveClass('status-badge', 'status-manager-approved');
    });

    it('承認完了ステータスが正しく表示される', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'approved',
        },
      });

      renderReportDetailPage();

      const badge = screen.getByText('承認完了');
      expect(badge).toHaveClass('status-badge', 'status-approved');
    });

    it('差戻しステータスが正しく表示される', () => {
      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'rejected',
        },
      });

      renderReportDetailPage();

      const badge = screen.getByText('差戻し');
      expect(badge).toHaveClass('status-badge', 'status-rejected');
    });
  });

  describe('承認待ち通知の表示', () => {
    it('課長で提出済日報を表示した場合、承認通知が表示される', () => {
      useAuthStore.setState({
        user: {
          id: 2,
          name: '鈴木課長',
          email: 'suzuki@example.com',
          position: { id: 2, name: '課長', level: 2 },
        },
      });

      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'submitted',
        },
      });

      renderReportDetailPage();

      expect(
        screen.getByText(/この日報の承認・差戻しを行うことができます/)
      ).toBeInTheDocument();
    });
  });

  describe('送信中の状態', () => {
    it('送信中は承認ボタンが無効になる', () => {
      useAuthStore.setState({
        user: {
          id: 2,
          name: '鈴木課長',
          email: 'suzuki@example.com',
          position: { id: 2, name: '課長', level: 2 },
        },
      });

      useReportStore.setState({
        currentReport: {
          ...mockReportDetail,
          status: 'submitted',
        },
        isSubmitting: true,
      });

      renderReportDetailPage();

      const approveButton = screen.getByRole('button', { name: '承認' });
      const rejectButton = screen.getByRole('button', { name: '差戻し' });

      expect(approveButton).toBeDisabled();
      expect(rejectButton).toBeDisabled();
    });
  });
});

/**
 * 日報作成・編集画面のテスト
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import type { DailyReportDetail } from '@/schemas/data';
import { useReportStore } from '@/stores/reports';

import { ReportFormPage } from './ReportFormPage';

// APIモック
vi.mock('@/lib/api/customers', () => ({
  getCustomers: vi.fn().mockResolvedValue({
    items: [
      { id: 1, name: '株式会社ABC', isActive: true },
      { id: 2, name: '株式会社XYZ', isActive: true },
    ],
    pagination: { currentPage: 1, totalPages: 1, totalCount: 2, perPage: 100 },
  }),
}));

vi.mock('@/lib/api/masters', () => ({
  getVisitResults: vi.fn().mockResolvedValue([
    { code: 'negotiating', name: '商談中' },
    { code: 'closed_won', name: '成約' },
    { code: 'closed_lost', name: '見送り' },
  ]),
}));

vi.mock('@/lib/api/attachments', () => ({
  uploadAttachment: vi.fn().mockResolvedValue({ id: 1, file_name: 'test.pdf' }),
  deleteAttachment: vi.fn().mockResolvedValue(undefined),
  validateAttachment: vi.fn().mockReturnValue({ valid: true }),
}));

// useBlocker をモック
const mockBlocker = { state: 'unblocked', proceed: vi.fn(), reset: vi.fn() };
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useBlocker: () => mockBlocker,
  };
});

const mockDraftReport: DailyReportDetail = {
  id: 1,
  salespersonId: 1,
  reportDate: new Date('2024-01-15'),
  problem: 'テスト課題',
  plan: 'テスト計画',
  status: 'draft',
  submittedAt: null,
  managerApprovedAt: null,
  directorApprovedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  salesperson: {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    positionId: 1,
    managerId: null,
    directorId: null,
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
      visitTime: new Date('2024-01-15T10:00:00'),
      content: 'テスト訪問内容',
      result: 'negotiating',
      createdAt: new Date(),
      updatedAt: new Date(),
      customer: { id: 1, name: '株式会社ABC' },
      attachments: [],
    },
  ],
  approvalHistories: [],
  comments: [],
};

const mockRejectedReport: DailyReportDetail = {
  ...mockDraftReport,
  status: 'rejected',
  approvalHistories: [
    {
      id: 1,
      dailyReportId: 1,
      approverId: 2,
      action: 'rejected',
      comment: '訪問内容をもう少し詳しく記載してください',
      approvalLevel: 'manager',
      createdAt: new Date(),
      approver: { id: 2, name: '鈴木課長' },
    },
  ],
};

const mockSubmittedReport: DailyReportDetail = {
  ...mockDraftReport,
  status: 'submitted',
  submittedAt: new Date(),
};

describe('ReportFormPage', () => {
  beforeEach(() => {
    // ストアをリセット
    useReportStore.setState({
      reports: [],
      pagination: null,
      searchQuery: {},
      currentReport: null,
      isLoading: false,
      isSubmitting: false,
      error: null,
    });

    vi.clearAllMocks();
    mockBlocker.state = 'unblocked';
  });

  const renderCreatePage = () => {
    return render(
      <MemoryRouter initialEntries={['/reports/new']}>
        <Routes>
          <Route path="/reports/new" element={<ReportFormPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  const renderEditPage = (reportId = 1) => {
    return render(
      <MemoryRouter initialEntries={[`/reports/${reportId}/edit`]}>
        <Routes>
          <Route path="/reports/:id/edit" element={<ReportFormPage />} />
          <Route path="/reports/:id" element={<div>詳細画面</div>} />
          <Route path="/reports" element={<div>一覧画面</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  describe('新規作成画面', () => {
    it('should render create form with title', async () => {
      renderCreatePage();

      await waitFor(() => {
        expect(screen.getByText('日報作成')).toBeInTheDocument();
      });
    });

    it('should have report date defaulted to today', async () => {
      renderCreatePage();

      const today = new Date().toISOString().split('T')[0];
      await waitFor(() => {
        const dateInput = screen.getByLabelText(/報告日/i);
        expect(dateInput).toHaveValue(today);
      });
    });

    it('should show empty visits message', async () => {
      renderCreatePage();

      await waitFor(() => {
        expect(screen.getByText('訪問記録がありません')).toBeInTheDocument();
      });
    });

    it('should add visit record when clicking add button', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      await waitFor(() => {
        expect(screen.getByText('＋ 追加')).toBeInTheDocument();
      });

      await user.click(screen.getByText('＋ 追加'));

      expect(screen.getByText('No.1')).toBeInTheDocument();
      expect(screen.getByText('新規')).toBeInTheDocument();
    });

    it('should show validation error for empty required fields', async () => {
      const user = userEvent.setup();
      renderCreatePage();

      // 訪問記録を追加
      await waitFor(() => {
        expect(screen.getByText('＋ 追加')).toBeInTheDocument();
      });
      await user.click(screen.getByText('＋ 追加'));

      // 提出ボタンをクリック
      await user.click(screen.getByText('提出'));

      await waitFor(() => {
        expect(screen.getByText('顧客を選択してください')).toBeInTheDocument();
        expect(screen.getByText('訪問内容を入力してください')).toBeInTheDocument();
      });
    });

    it('should show validation error when submitting with no visits', async () => {
      const user = userEvent.setup();

      // confirmをモック
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderCreatePage();

      await waitFor(() => {
        expect(screen.getByText('提出')).toBeInTheDocument();
      });

      await user.click(screen.getByText('提出'));

      await waitFor(() => {
        expect(screen.getByText('訪問記録を1件以上入力してください')).toBeInTheDocument();
      });
    });
  });

  describe('編集画面', () => {
    it('should render edit form with title', async () => {
      useReportStore.setState({ currentReport: mockDraftReport });

      renderEditPage();

      await waitFor(() => {
        expect(screen.getByText('日報編集')).toBeInTheDocument();
      });
    });

    it('should load existing report data', async () => {
      const fetchReportMock = vi.fn().mockResolvedValue(undefined);
      useReportStore.setState({
        currentReport: mockDraftReport,
        fetchReport: fetchReportMock,
      });

      renderEditPage();

      await waitFor(() => {
        expect(fetchReportMock).toHaveBeenCalledWith(1);
      });
    });

    it('should populate form with existing data', async () => {
      useReportStore.setState({ currentReport: mockDraftReport });

      renderEditPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('テスト課題')).toBeInTheDocument();
        expect(screen.getByDisplayValue('テスト計画')).toBeInTheDocument();
        expect(screen.getByDisplayValue('テスト訪問内容')).toBeInTheDocument();
      });
    });

    it('should disable report date input in edit mode', async () => {
      useReportStore.setState({ currentReport: mockDraftReport });

      renderEditPage();

      await waitFor(() => {
        const dateInput = screen.getByLabelText(/報告日/i);
        expect(dateInput).toBeDisabled();
      });
    });
  });

  describe('編集権限チェック', () => {
    it('should show error for submitted report', async () => {
      useReportStore.setState({ currentReport: mockSubmittedReport });

      renderEditPage();

      await waitFor(() => {
        expect(screen.getByText('この日報は編集できません。下書きまたは差戻し状態の日報のみ編集可能です。')).toBeInTheDocument();
      });
    });

    it('should show back button when edit is not allowed', async () => {
      useReportStore.setState({ currentReport: mockSubmittedReport });

      renderEditPage();

      await waitFor(() => {
        expect(screen.getByText('戻る')).toBeInTheDocument();
      });
    });

    it('should allow editing draft report', async () => {
      useReportStore.setState({ currentReport: mockDraftReport });

      renderEditPage();

      await waitFor(() => {
        expect(screen.queryByText('この日報は編集できません')).not.toBeInTheDocument();
        expect(screen.getByText('日報編集')).toBeInTheDocument();
      });
    });

    it('should allow editing rejected report', async () => {
      useReportStore.setState({ currentReport: mockRejectedReport });

      renderEditPage();

      await waitFor(() => {
        expect(screen.queryByText('この日報は編集できません')).not.toBeInTheDocument();
        expect(screen.getByText('日報編集')).toBeInTheDocument();
      });
    });
  });

  describe('差戻し表示', () => {
    it('should show reject notice for rejected report', async () => {
      useReportStore.setState({ currentReport: mockRejectedReport });

      renderEditPage();

      await waitFor(() => {
        expect(screen.getByText('差戻し理由:')).toBeInTheDocument();
        expect(screen.getByText('訪問内容をもう少し詳しく記載してください')).toBeInTheDocument();
      });
    });

    it('should show resubmit button for rejected report', async () => {
      useReportStore.setState({ currentReport: mockRejectedReport });

      renderEditPage();

      await waitFor(() => {
        expect(screen.getByText('再提出')).toBeInTheDocument();
      });
    });
  });

  describe('変更検知', () => {
    it('should show unsaved changes notice when form is modified', async () => {
      const user = userEvent.setup();
      useReportStore.setState({ currentReport: mockDraftReport });

      renderEditPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('テスト課題')).toBeInTheDocument();
      });

      // problemを変更
      const problemTextarea = screen.getByDisplayValue('テスト課題');
      await user.clear(problemTextarea);
      await user.type(problemTextarea, '変更後の課題');

      await waitFor(() => {
        expect(screen.getByText('未保存の変更があります')).toBeInTheDocument();
      });
    });

    it('should show confirm dialog when canceling with unsaved changes', async () => {
      const user = userEvent.setup();
      const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(false);

      useReportStore.setState({ currentReport: mockDraftReport });

      renderEditPage();

      await waitFor(() => {
        expect(screen.getByDisplayValue('テスト課題')).toBeInTheDocument();
      });

      // problemを変更
      const problemTextarea = screen.getByDisplayValue('テスト課題');
      await user.clear(problemTextarea);
      await user.type(problemTextarea, '変更後');

      // キャンセルをクリック
      await user.click(screen.getByText('キャンセル'));

      expect(confirmMock).toHaveBeenCalledWith('未保存の変更があります。破棄しますか？');
    });
  });

  describe('訪問記録操作', () => {
    it('should remove visit record when clicking delete', async () => {
      const user = userEvent.setup();
      const deleteVisitMock = vi.fn().mockResolvedValue(undefined);
      const confirmMock = vi.spyOn(window, 'confirm').mockReturnValue(true);

      useReportStore.setState({
        currentReport: mockDraftReport,
        deleteVisit: deleteVisitMock,
      });

      renderEditPage();

      await waitFor(() => {
        expect(screen.getByText('No.1')).toBeInTheDocument();
      });

      await user.click(screen.getByText('削除'));

      expect(confirmMock).toHaveBeenCalledWith('この訪問記録を削除しますか？');
      expect(deleteVisitMock).toHaveBeenCalledWith(1);
    });

    it('should remove new visit without API call', async () => {
      const user = userEvent.setup();
      const deleteVisitMock = vi.fn().mockResolvedValue(undefined);

      useReportStore.setState({
        currentReport: mockDraftReport,
        deleteVisit: deleteVisitMock,
      });

      renderEditPage();

      // 新規訪問記録を追加
      await waitFor(() => {
        expect(screen.getByText('＋ 追加')).toBeInTheDocument();
      });
      await user.click(screen.getByText('＋ 追加'));

      // No.2の新規訪問記録があるはず
      expect(screen.getByText('No.2')).toBeInTheDocument();

      // 新規訪問記録の削除ボタンをクリック
      const deleteButtons = screen.getAllByText('削除');
      await user.click(deleteButtons[1]!);

      // 新規訪問記録はAPIを呼ばない
      expect(deleteVisitMock).not.toHaveBeenCalled();
    });
  });

  describe('ローディング状態', () => {
    it('should show loading state in edit mode', () => {
      useReportStore.setState({ isLoading: true });

      renderEditPage();

      expect(screen.getByText('読み込み中...')).toBeInTheDocument();
    });
  });

  describe('エラー表示', () => {
    it('should show store error', async () => {
      useReportStore.setState({
        currentReport: mockDraftReport,
        error: 'サーバーエラーが発生しました'
      });

      renderEditPage();

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('サーバーエラーが発生しました');
      });
    });
  });
});

/**
 * 承認ストアのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useApprovalsStore } from './approvals';

// APIモジュールをモック
vi.mock('@/lib/api/approvals', () => ({
  getApprovals: vi.fn(),
  approveReport: vi.fn(),
  rejectReport: vi.fn(),
  getApprovalHistory: vi.fn(),
}));

describe('useApprovalsStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useApprovalsStore.getState().reset();

    // モックをリセット
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useApprovalsStore.getState();

      expect(state.approvals).toEqual([]);
      expect(state.pagination).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isActionLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('fetchApprovals', () => {
    it('should set loading state during fetch', async () => {
      const { getApprovals } = await import('@/lib/api/approvals');
      const mockGetApprovals = vi.mocked(getApprovals);

      mockGetApprovals.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true as const,
                  data: {
                    items: [],
                    pagination: {
                      currentPage: 1,
                      perPage: 20,
                      totalPages: 0,
                      totalCount: 0,
                    },
                  },
                }),
              100
            )
          )
      );

      const fetchPromise = useApprovalsStore.getState().fetchApprovals();

      expect(useApprovalsStore.getState().isLoading).toBe(true);

      await fetchPromise;

      expect(useApprovalsStore.getState().isLoading).toBe(false);
    });

    it('should set approvals and pagination on successful fetch', async () => {
      const { getApprovals } = await import('@/lib/api/approvals');
      const mockGetApprovals = vi.mocked(getApprovals);

      const mockApprovals = [
        {
          id: 1,
          reportDate: new Date('2024-01-15'),
          status: 'submitted' as const,
          submittedAt: new Date('2024-01-15T18:00:00Z'),
          createdAt: new Date('2024-01-15T17:00:00Z'),
          updatedAt: new Date('2024-01-15T18:00:00Z'),
          salesperson: { id: 1, name: '山田太郎' },
          visitCount: 3,
        },
      ];

      const mockPagination = {
        currentPage: 1,
        perPage: 20,
        totalPages: 1,
        totalCount: 1,
      };

      mockGetApprovals.mockResolvedValue({
        success: true,
        data: {
          items: mockApprovals,
          pagination: mockPagination,
        },
      });

      await useApprovalsStore.getState().fetchApprovals();

      const state = useApprovalsStore.getState();
      expect(state.approvals).toEqual(mockApprovals);
      expect(state.pagination).toEqual(mockPagination);
      expect(state.error).toBeNull();
    });

    it('should set error on failed fetch', async () => {
      const { getApprovals } = await import('@/lib/api/approvals');
      const mockGetApprovals = vi.mocked(getApprovals);

      mockGetApprovals.mockRejectedValue(new Error('Network error'));

      await expect(
        useApprovalsStore.getState().fetchApprovals()
      ).rejects.toThrow();

      const state = useApprovalsStore.getState();
      expect(state.approvals).toEqual([]);
      expect(state.error).toBe('Network error');
    });
  });

  describe('approveReport', () => {
    it('should set action loading state during approval', async () => {
      const { approveReport } = await import('@/lib/api/approvals');
      const mockApproveReport = vi.mocked(approveReport);

      mockApproveReport.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true as const,
                  data: {
                    id: 1,
                    status: 'manager_approved',
                    manager_approved_at: '2024-01-15T19:00:00Z',
                  },
                }),
              100
            )
          )
      );

      const approvePromise = useApprovalsStore.getState().approveReport(1);

      expect(useApprovalsStore.getState().isActionLoading).toBe(true);

      await approvePromise;

      expect(useApprovalsStore.getState().isActionLoading).toBe(false);
    });

    it('should remove report from approvals on successful approval', async () => {
      const { approveReport } = await import('@/lib/api/approvals');
      const mockApproveReport = vi.mocked(approveReport);

      // Set initial state with approvals
      useApprovalsStore.setState({
        approvals: [
          {
            id: 1,
            reportDate: new Date('2024-01-15'),
            status: 'submitted',
            submittedAt: new Date('2024-01-15T18:00:00Z'),
            createdAt: new Date('2024-01-15T17:00:00Z'),
            updatedAt: new Date('2024-01-15T18:00:00Z'),
            salesperson: { id: 1, name: '山田太郎' },
            visitCount: 3,
          },
          {
            id: 2,
            reportDate: new Date('2024-01-16'),
            status: 'submitted',
            submittedAt: new Date('2024-01-16T18:00:00Z'),
            createdAt: new Date('2024-01-16T17:00:00Z'),
            updatedAt: new Date('2024-01-16T18:00:00Z'),
            salesperson: { id: 2, name: '佐藤花子' },
            visitCount: 2,
          },
        ],
      });

      mockApproveReport.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          status: 'manager_approved',
          manager_approved_at: '2024-01-15T19:00:00Z',
        },
      });

      await useApprovalsStore
        .getState()
        .approveReport(1, { comment: '良いです' });

      const state = useApprovalsStore.getState();
      expect(state.approvals).toHaveLength(1);
      expect(state.approvals[0]?.id).toBe(2);
      expect(state.error).toBeNull();
    });

    it('should set error on failed approval', async () => {
      const { approveReport } = await import('@/lib/api/approvals');
      const mockApproveReport = vi.mocked(approveReport);

      mockApproveReport.mockRejectedValue(new Error('Permission denied'));

      await expect(
        useApprovalsStore.getState().approveReport(1)
      ).rejects.toThrow();

      const state = useApprovalsStore.getState();
      expect(state.error).toBe('Permission denied');
    });
  });

  describe('rejectReport', () => {
    it('should remove report from approvals on successful rejection', async () => {
      const { rejectReport } = await import('@/lib/api/approvals');
      const mockRejectReport = vi.mocked(rejectReport);

      // Set initial state with approvals
      useApprovalsStore.setState({
        approvals: [
          {
            id: 1,
            reportDate: new Date('2024-01-15'),
            status: 'submitted',
            submittedAt: new Date('2024-01-15T18:00:00Z'),
            createdAt: new Date('2024-01-15T17:00:00Z'),
            updatedAt: new Date('2024-01-15T18:00:00Z'),
            salesperson: { id: 1, name: '山田太郎' },
            visitCount: 3,
          },
        ],
      });

      mockRejectReport.mockResolvedValue({
        success: true,
        data: {
          id: 1,
          status: 'rejected',
        },
      });

      await useApprovalsStore.getState().rejectReport(1, {
        comment: '内容を修正してください',
      });

      const state = useApprovalsStore.getState();
      expect(state.approvals).toHaveLength(0);
      expect(state.error).toBeNull();
    });

    it('should set error on failed rejection', async () => {
      const { rejectReport } = await import('@/lib/api/approvals');
      const mockRejectReport = vi.mocked(rejectReport);

      mockRejectReport.mockRejectedValue(new Error('Invalid status'));

      await expect(
        useApprovalsStore.getState().rejectReport(1, { comment: '差戻し理由' })
      ).rejects.toThrow();

      const state = useApprovalsStore.getState();
      expect(state.error).toBe('Invalid status');
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useApprovalsStore.setState({ error: 'Some error' });

      useApprovalsStore.getState().clearError();

      expect(useApprovalsStore.getState().error).toBeNull();
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', () => {
      useApprovalsStore.setState({
        approvals: [
          {
            id: 1,
            reportDate: new Date('2024-01-15'),
            status: 'submitted',
            submittedAt: new Date('2024-01-15T18:00:00Z'),
            createdAt: new Date('2024-01-15T17:00:00Z'),
            updatedAt: new Date('2024-01-15T18:00:00Z'),
            salesperson: { id: 1, name: '山田太郎' },
            visitCount: 3,
          },
        ],
        pagination: {
          currentPage: 1,
          perPage: 20,
          totalPages: 1,
          totalCount: 1,
        },
        isLoading: true,
        isActionLoading: true,
        error: 'Some error',
      });

      useApprovalsStore.getState().reset();

      const state = useApprovalsStore.getState();
      expect(state.approvals).toEqual([]);
      expect(state.pagination).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.isActionLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});

/**
 * 承認待ち一覧画面
 * SCR-020
 */

import { useEffect, useState, useCallback } from 'react';

import { useNavigate } from 'react-router-dom';

import { ReportStatus } from '@/schemas/data';
import { useApprovalsStore } from '@/stores/approvals';
import { useAuthStore } from '@/stores/auth';

import './ApprovalsPage.css';

/** ステータスラベル */
const STATUS_LABELS: Record<string, string> = {
  [ReportStatus.DRAFT]: '下書き',
  [ReportStatus.SUBMITTED]: '提出済',
  [ReportStatus.MANAGER_APPROVED]: '課長承認済',
  [ReportStatus.APPROVED]: '承認完了',
  [ReportStatus.REJECTED]: '差戻し',
};

/** ステータスクラス */
const STATUS_CLASSES: Record<string, string> = {
  [ReportStatus.DRAFT]: 'status-draft',
  [ReportStatus.SUBMITTED]: 'status-submitted',
  [ReportStatus.MANAGER_APPROVED]: 'status-manager-approved',
  [ReportStatus.APPROVED]: 'status-approved',
  [ReportStatus.REJECTED]: 'status-rejected',
};

export function ApprovalsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const {
    approvals,
    pagination,
    isLoading,
    isActionLoading,
    error,
    fetchApprovals,
    approveReport,
    rejectReport,
    clearError,
  } = useApprovalsStore();

  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [comment, setComment] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // 承認権限チェック（課長または部長のみ）
  const hasApprovalPermission = user && user.position.level >= 2;

  // 承認待ち一覧を取得
  const loadApprovals = useCallback(
    async (page = 1) => {
      try {
        await fetchApprovals({ page, per_page: 20 });
      } catch {
        // エラーはストアで処理される
      }
    },
    [fetchApprovals]
  );

  useEffect(() => {
    if (hasApprovalPermission) {
      void loadApprovals();
    }
  }, [hasApprovalPermission, loadApprovals]);

  // 権限がない場合はダッシュボードにリダイレクト
  useEffect(() => {
    if (user && !hasApprovalPermission) {
      void navigate('/dashboard');
    }
  }, [user, hasApprovalPermission, navigate]);

  const handleLogout = async () => {
    await logout();
  };

  const handleViewDetail = (reportId: number) => {
    void navigate(`/reports/${reportId}`);
  };

  const handleOpenApproveDialog = (reportId: number) => {
    setSelectedReportId(reportId);
    setComment('');
    setActionError(null);
    setShowApproveDialog(true);
  };

  const handleOpenRejectDialog = (reportId: number) => {
    setSelectedReportId(reportId);
    setRejectReason('');
    setActionError(null);
    setShowRejectDialog(true);
  };

  const handleCloseDialog = () => {
    setShowApproveDialog(false);
    setShowRejectDialog(false);
    setSelectedReportId(null);
    setComment('');
    setRejectReason('');
    setActionError(null);
  };

  const handleApprove = async () => {
    if (selectedReportId === null) return;

    try {
      setActionError(null);
      await approveReport(selectedReportId, comment ? { comment } : undefined);
      handleCloseDialog();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : '承認に失敗しました');
    }
  };

  const handleReject = async () => {
    if (selectedReportId === null) return;

    if (!rejectReason.trim()) {
      setActionError('差戻し理由を入力してください');
      return;
    }

    try {
      setActionError(null);
      await rejectReport(selectedReportId, { comment: rejectReason });
      handleCloseDialog();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : '差戻しに失敗しました'
      );
    }
  };

  const handlePageChange = (page: number) => {
    void loadApprovals(page);
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (date: Date | string | null) => {
    if (!date) return '-';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!hasApprovalPermission) {
    return null;
  }

  return (
    <div className="approvals-page">
      <header className="approvals-header">
        <h1 className="approvals-title">営業日報システム</h1>
        <nav className="approvals-nav">
          <button className="nav-button" onClick={() => navigate('/dashboard')}>
            ダッシュボード
          </button>
          <button className="nav-button active">承認待ち</button>
        </nav>
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className="user-position">{user?.position.name}</span>
          <button className="logout-button" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </header>

      <main className="approvals-main">
        <div className="page-header">
          <h2>承認待ち一覧</h2>
          {pagination && (
            <span className="result-count">{pagination.totalCount}件</span>
          )}
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={clearError}>閉じる</button>
          </div>
        )}

        {isLoading && (
          <div className="loading-state">
            <p>読み込み中...</p>
          </div>
        )}

        {!isLoading && approvals.length === 0 && (
          <div className="empty-state">
            <p>承認待ちの日報はありません</p>
          </div>
        )}

        {!isLoading && approvals.length > 0 && (
          <>
            <div className="approvals-table-container">
              <table className="approvals-table">
                <thead>
                  <tr>
                    <th>報告日</th>
                    <th>担当者</th>
                    <th>訪問件数</th>
                    <th>提出日時</th>
                    <th>ステータス</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {approvals.map((report) => (
                    <tr key={report.id}>
                      <td>{formatDate(report.reportDate)}</td>
                      <td>{report.salesperson.name}</td>
                      <td className="text-center">{report.visitCount}件</td>
                      <td>{formatDateTime(report.submittedAt)}</td>
                      <td>
                        <span
                          className={`status-badge ${STATUS_CLASSES[report.status] ?? ''}`}
                        >
                          {STATUS_LABELS[report.status] ?? report.status}
                        </span>
                      </td>
                      <td className="action-cell">
                        <button
                          className="action-button view-button"
                          onClick={() => handleViewDetail(report.id)}
                        >
                          詳細
                        </button>
                        <button
                          className="action-button approve-button"
                          onClick={() => handleOpenApproveDialog(report.id)}
                          disabled={isActionLoading}
                        >
                          承認
                        </button>
                        <button
                          className="action-button reject-button"
                          onClick={() => handleOpenRejectDialog(report.id)}
                          disabled={isActionLoading}
                        >
                          差戻し
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="pagination-button"
                  disabled={pagination.currentPage <= 1}
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                >
                  前へ
                </button>
                <span className="pagination-info">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  className="pagination-button"
                  disabled={pagination.currentPage >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                >
                  次へ
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* 承認ダイアログ */}
      {showApproveDialog && (
        <div className="dialog-overlay" onClick={handleCloseDialog}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>日報を承認</h3>
            <p>この日報を承認しますか?</p>

            <div className="dialog-field">
              <label htmlFor="approve-comment">コメント（任意）</label>
              <textarea
                id="approve-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="コメントを入力"
                rows={3}
              />
            </div>

            {actionError && <div className="dialog-error">{actionError}</div>}

            <div className="dialog-actions">
              <button
                className="dialog-button cancel-button"
                onClick={handleCloseDialog}
                disabled={isActionLoading}
              >
                キャンセル
              </button>
              <button
                className="dialog-button confirm-button"
                onClick={handleApprove}
                disabled={isActionLoading}
              >
                {isActionLoading ? '処理中...' : '承認する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 差戻しダイアログ */}
      {showRejectDialog && (
        <div className="dialog-overlay" onClick={handleCloseDialog}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>日報を差戻し</h3>
            <p>この日報を差戻しますか?</p>

            <div className="dialog-field">
              <label htmlFor="reject-reason">
                差戻し理由 <span className="required">*</span>
              </label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="差戻し理由を入力してください"
                rows={3}
                required
              />
            </div>

            {actionError && <div className="dialog-error">{actionError}</div>}

            <div className="dialog-actions">
              <button
                className="dialog-button cancel-button"
                onClick={handleCloseDialog}
                disabled={isActionLoading}
              >
                キャンセル
              </button>
              <button
                className="dialog-button reject-confirm-button"
                onClick={handleReject}
                disabled={isActionLoading}
              >
                {isActionLoading ? '処理中...' : '差戻す'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

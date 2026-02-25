/**
 * 承認待ち一覧画面
 * SCR-020
 */

import { useEffect, useState } from 'react';

import { Navigate, useNavigate } from 'react-router-dom';

import type { ApprovalSearchQuery } from '@/lib/api/approvals';
import { useApprovalStore } from '@/stores/approvals';
import { useAuthStore } from '@/stores/auth';

import './ApprovalListPage.css';

export function ApprovalListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    approvals,
    pagination,
    isLoading,
    error,
    fetchApprovals,
    clearError,
  } = useApprovalStore();

  // 検索条件
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const positionLevel = user?.position.level ?? 1;
  const hasPermission = positionLevel >= 2;

  // 初期読み込み (権限がある場合のみ)
  useEffect(() => {
    if (hasPermission) {
      void fetchApprovals();
    }
  }, [fetchApprovals, hasPermission]);

  // 権限チェック: 課長（level 2）以上のみアクセス可能
  if (!hasPermission) {
    return <Navigate to="/dashboard" replace />;
  }

  // 検索実行
  const handleSearch = () => {
    clearError();
    const query: Partial<ApprovalSearchQuery> = {
      page: 1,
    };
    if (dateFrom) query.date_from = dateFrom;
    if (dateTo) query.date_to = dateTo;

    void fetchApprovals(query);
  };

  // 検索条件クリア
  const handleClear = () => {
    setDateFrom('');
    setDateTo('');
    clearError();
    void fetchApprovals({ page: 1 });
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    void fetchApprovals({ page });
  };

  // 日報詳細へ遷移
  const handleViewDetail = (id: number) => {
    void navigate(`/reports/${id}`);
  };

  // 日付フォーマット
  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP');
  };

  // 日時フォーマット
  const formatDateTime = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP');
  };

  return (
    <div className="approval-list-page">
      <div className="page-header">
        <h1 className="page-title">承認待ち一覧</h1>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="search-form">
        <h2 className="search-title">検索条件</h2>
        <div className="search-fields">
          <div className="search-field">
            <label htmlFor="dateFrom" className="field-label">
              期間
            </label>
            <div className="date-range">
              <input
                id="dateFrom"
                type="date"
                className="field-input"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
              <span className="date-separator">〜</span>
              <input
                id="dateTo"
                type="date"
                className="field-input"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="search-actions">
            <button
              type="button"
              className="search-button"
              onClick={handleSearch}
              disabled={isLoading}
            >
              検索
            </button>
            <button
              type="button"
              className="clear-button"
              onClick={handleClear}
              disabled={isLoading}
            >
              クリア
            </button>
          </div>
        </div>
      </div>

      <div className="approval-table-container">
        <div className="result-count">
          検索結果: {pagination?.totalCount ?? 0}件
        </div>

        {isLoading && <div className="loading">読み込み中...</div>}
        {!isLoading && approvals.length === 0 && (
          <div className="empty-message">承認待ちの日報がありません</div>
        )}
        {!isLoading && approvals.length > 0 && (
          <>
            <table className="approval-table">
              <thead>
                <tr>
                  <th>報告日</th>
                  <th>担当者</th>
                  <th>訪問件数</th>
                  <th>提出日時</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((report) => (
                  <tr key={report.id}>
                    <td>{formatDate(report.reportDate)}</td>
                    <td>{report.salesperson.name}</td>
                    <td>{report.visitCount}件</td>
                    <td>{formatDateTime(report.submittedAt)}</td>
                    <td>
                      <button
                        type="button"
                        className="detail-button"
                        onClick={() => handleViewDetail(report.id)}
                      >
                        詳細
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pagination && pagination.totalPages > 1 && (
              <div className="pagination">
                <button
                  type="button"
                  className="page-button"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1}
                >
                  &lt; 前へ
                </button>
                <span className="page-info">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="page-button"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages}
                >
                  次へ &gt;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

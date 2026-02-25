/**
 * 日報一覧画面
 * SCR-010
 */

import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import type { ReportSearchQuery } from '@/schemas/api';
import type { ReportStatus } from '@/schemas/data';
import { useAuthStore } from '@/stores/auth';
import { useReportStore } from '@/stores/reports';

import './ReportListPage.css';

const STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  submitted: '提出済',
  manager_approved: '課長承認済',
  approved: '承認完了',
  rejected: '差戻し',
};

const STATUS_OPTIONS = [
  { value: '', label: '全て' },
  { value: 'draft', label: '下書き' },
  { value: 'submitted', label: '提出済' },
  { value: 'manager_approved', label: '課長承認済' },
  { value: 'approved', label: '承認完了' },
  { value: 'rejected', label: '差戻し' },
];

export function ReportListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { reports, pagination, isLoading, error, fetchReports, clearError } =
    useReportStore();

  // 検索条件
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [status, setStatus] = useState('');

  const positionLevel = user?.position.level ?? 1;
  const isStaff = positionLevel === 1;

  // 初期読み込み
  useEffect(() => {
    void fetchReports();
  }, [fetchReports]);

  // 検索実行
  const handleSearch = () => {
    clearError();
    const query: Partial<ReportSearchQuery> = {
      page: 1,
    };
    if (dateFrom) query.date_from = dateFrom;
    if (dateTo) query.date_to = dateTo;
    if (status) query.status = status as ReportStatus;

    void fetchReports(query);
  };

  // 検索条件クリア
  const handleClear = () => {
    setDateFrom('');
    setDateTo('');
    setStatus('');
    clearError();
    void fetchReports({ page: 1 });
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    void fetchReports({ page });
  };

  // 日報詳細へ遷移
  const handleViewDetail = (id: number) => {
    void navigate(`/reports/${id}`);
  };

  // 新規作成へ遷移
  const handleCreate = () => {
    void navigate('/reports/new');
  };

  // 日付フォーマット
  const formatDate = (dateStr: string | Date) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP');
  };

  return (
    <div className="report-list-page">
      <div className="page-header">
        <h1 className="page-title">日報一覧</h1>
        {isStaff && (
          <button
            type="button"
            className="create-button"
            onClick={handleCreate}
          >
            新規作成
          </button>
        )}
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

          <div className="search-field">
            <label htmlFor="status" className="field-label">
              ステータス
            </label>
            <select
              id="status"
              className="field-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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

      <div className="report-table-container">
        <div className="result-count">
          検索結果: {pagination?.totalCount ?? 0}件
        </div>

        {isLoading && <div className="loading">読み込み中...</div>}
        {!isLoading && reports.length === 0 && (
          <div className="empty-message">日報がありません</div>
        )}
        {!isLoading && reports.length > 0 && (
          <>
            <table className="report-table">
              <thead>
                <tr>
                  <th>報告日</th>
                  <th>担当者</th>
                  <th>訪問件数</th>
                  <th>ステータス</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td>{formatDate(report.reportDate)}</td>
                    <td>{report.salesperson.name}</td>
                    <td>{report.visitCount}件</td>
                    <td>
                      <span
                        className={`status-badge status-${report.status.replace('_', '-')}`}
                      >
                        {STATUS_LABELS[report.status] ?? report.status}
                      </span>
                    </td>
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

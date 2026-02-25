/**
 * ダッシュボード画面
 * SCR-002
 */

import { Link } from 'react-router-dom';

import {
  useDashboardSummary,
  useRecentReports,
  usePendingApprovals,
} from '@/hooks/useDashboard';
import { ReportStatus, type DailyReportSummary } from '@/schemas/data';
import { useAuthStore } from '@/stores/auth';

import './DashboardPage.css';

/**
 * ステータスラベルの表示
 */
function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    [ReportStatus.DRAFT]: '下書き',
    [ReportStatus.SUBMITTED]: '提出済',
    [ReportStatus.MANAGER_APPROVED]: '課長承認済',
    [ReportStatus.APPROVED]: '承認完了',
    [ReportStatus.REJECTED]: '差戻し',
  };
  return labels[status] ?? status;
}

/**
 * ステータスバッジのクラス名を取得
 */
function getStatusClass(status: string): string {
  const classes: Record<string, string> = {
    [ReportStatus.DRAFT]: 'status-draft',
    [ReportStatus.SUBMITTED]: 'status-submitted',
    [ReportStatus.MANAGER_APPROVED]: 'status-manager-approved',
    [ReportStatus.APPROVED]: 'status-approved',
    [ReportStatus.REJECTED]: 'status-rejected',
  };
  return classes[status] ?? '';
}

/**
 * 日付フォーマット
 */
function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 日報一覧テーブル
 */
function ReportTable({
  reports,
  isLoading,
  emptyMessage,
}: {
  reports: DailyReportSummary[];
  isLoading: boolean;
  emptyMessage: string;
}) {
  if (isLoading) {
    return <p className="loading-message">読み込み中...</p>;
  }

  if (reports.length === 0) {
    return <p className="empty-message">{emptyMessage}</p>;
  }

  return (
    <table className="report-table">
      <thead>
        <tr>
          <th>日付</th>
          <th>担当者</th>
          <th>訪問数</th>
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
              <span className={'status-badge ' + getStatusClass(report.status)}>
                {getStatusLabel(report.status)}
              </span>
            </td>
            <td>
              <Link to={'/reports/' + report.id} className="detail-link">
                詳細
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DashboardPage() {
  const { user } = useAuthStore();

  const positionLevel = user?.position.level ?? 1;
  const isManager = positionLevel >= 2;
  const isStaff = positionLevel === 1;

  // データ取得
  const { data: summary, isLoading: isSummaryLoading } = useDashboardSummary();
  const { data: recentReports = [], isLoading: isReportsLoading } =
    useRecentReports();
  const { data: pendingApprovals = [], isLoading: isApprovalsLoading } =
    usePendingApprovals(isManager);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">ダッシュボード</h1>
        {isStaff && (
          <Link to="/reports/new" className="create-button">
            新規日報作成
          </Link>
        )}
      </div>

      <div className="welcome-card">
        <h2>ようこそ、{user?.name}さん</h2>
        <p>
          {user?.position.name}としてログインしています。
          {isManager
            ? '部下の日報を確認・承認できます。'
            : '日報を作成・提出できます。'}
        </p>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon visit-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">
              {isSummaryLoading ? '-' : (summary?.visitCount ?? 0)}
            </span>
            <span className="summary-label">今月の訪問件数</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon report-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            </svg>
          </div>
          <div className="summary-content">
            <span className="summary-value">
              {isSummaryLoading ? '-' : (summary?.reportCount ?? 0)}
            </span>
            <span className="summary-label">今月の日報作成数</span>
          </div>
        </div>

        {isManager && (
          <div className="summary-card">
            <div className="summary-icon approval-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            </div>
            <div className="summary-content">
              <span className="summary-value">
                {isSummaryLoading ? '-' : (summary?.pendingApprovalCount ?? 0)}
              </span>
              <span className="summary-label">承認待ち件数</span>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3>直近の日報</h3>
            <Link to="/reports" className="see-all-link">
              一覧を見る
            </Link>
          </div>
          <div className="card-content">
            <ReportTable
              reports={recentReports}
              isLoading={isReportsLoading}
              emptyMessage="日報はまだありません"
            />
          </div>
        </div>

        {isManager && (
          <div className="dashboard-card">
            <div className="card-header">
              <h3>承認待ち一覧</h3>
              <Link to="/approvals" className="see-all-link">
                一覧を見る
              </Link>
            </div>
            <div className="card-content">
              <ReportTable
                reports={pendingApprovals}
                isLoading={isApprovalsLoading}
                emptyMessage="承認待ちの日報はありません"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

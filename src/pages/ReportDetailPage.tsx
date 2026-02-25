/**
 * 日報詳細画面
 * SCR-013
 */

import { useEffect } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { getAttachmentDownloadUrl } from '@/lib/api/attachments';
import { useAuthStore } from '@/stores/auth';
import { useReportStore } from '@/stores/reports';

import './ReportDetailPage.css';

const STATUS_LABELS: Record<string, string> = {
  draft: '下書き',
  submitted: '提出済',
  manager_approved: '課長承認済',
  approved: '承認完了',
  rejected: '差戻し',
};

const RESULT_LABELS: Record<string, string> = {
  negotiating: '商談中',
  closed_won: '成約',
  closed_lost: '見送り',
  information_gathering: '情報収集',
  other: 'その他',
};

const ACTION_LABELS: Record<string, string> = {
  approved: '承認',
  rejected: '差戻し',
};

export function ReportDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const reportId = id ? parseInt(id, 10) : null;

  const { user } = useAuthStore();
  const {
    currentReport,
    isLoading,
    isSubmitting,
    error,
    fetchReport,
    clearCurrentReport,
  } = useReportStore();

  const positionLevel = user?.position.level ?? 1;
  const isManager = positionLevel === 2;
  const isDirectorOrAbove = positionLevel >= 3;

  // 読み込み
  useEffect(() => {
    if (reportId) {
      void fetchReport(reportId);
    }
    return () => {
      clearCurrentReport();
    };
  }, [reportId, fetchReport, clearCurrentReport]);

  // 編集可能か判定
  const canEdit = () => {
    if (!currentReport) return false;
    const status = currentReport.status;
    const isOwner = currentReport.salesperson.id === user?.id;
    return isOwner && (status === 'draft' || status === 'rejected');
  };

  // 承認可能か判定
  const canApprove = () => {
    if (!currentReport) return false;
    const status = currentReport.status;

    if (isManager && status === 'submitted') return true;
    if (isDirectorOrAbove && status === 'manager_approved') return true;
    return false;
  };

  // 編集へ遷移
  const handleEdit = () => {
    void navigate(`/reports/${reportId}/edit`);
  };

  // 戻る
  const handleBack = () => {
    void navigate('/reports');
  };

  // 日付フォーマット
  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP');
  };

  // 日時フォーマット
  const formatDateTime = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ja-JP');
  };

  // 時刻フォーマット
  const formatTime = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ファイルサイズフォーマット
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (isLoading) {
    return <div className="loading">読み込み中...</div>;
  }

  if (!currentReport) {
    return <div className="not-found">日報が見つかりません</div>;
  }

  return (
    <div className="report-detail-page">
      <div className="page-header">
        <h1 className="page-title">日報詳細</h1>
        <div className="page-actions">
          {canEdit() && (
            <button type="button" className="edit-button" onClick={handleEdit}>
              編集
            </button>
          )}
          <button type="button" className="back-button" onClick={handleBack}>
            戻る
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {/* 基本情報 */}
      <div className="detail-section">
        <dl className="detail-list">
          <div className="detail-item">
            <dt>報告日</dt>
            <dd>{formatDate(currentReport.reportDate)}</dd>
          </div>
          <div className="detail-item">
            <dt>担当者</dt>
            <dd>{currentReport.salesperson.name}</dd>
          </div>
          <div className="detail-item">
            <dt>ステータス</dt>
            <dd>
              <span
                className={`status-badge status-${currentReport.status.replace('_', '-')}`}
              >
                {STATUS_LABELS[currentReport.status] ?? currentReport.status}
              </span>
            </dd>
          </div>
          <div className="detail-item">
            <dt>提出日時</dt>
            <dd>{formatDateTime(currentReport.submittedAt)}</dd>
          </div>
        </dl>
      </div>

      {/* 訪問記録 */}
      <div className="detail-section">
        <h2 className="section-title">訪問記録</h2>
        {currentReport.visitRecords.length === 0 ? (
          <p className="empty-message">訪問記録がありません</p>
        ) : (
          <div className="visit-list">
            {currentReport.visitRecords.map((visit) => (
              <div key={visit.id} className="visit-item">
                <div className="visit-header">
                  <span className="visit-customer">{visit.customer.name}</span>
                  <span className="visit-time">
                    {formatTime(visit.visitTime)}
                  </span>
                </div>
                <p className="visit-content">{visit.content}</p>
                {visit.result && (
                  <span className="visit-result">
                    結果: {RESULT_LABELS[visit.result] ?? visit.result}
                  </span>
                )}
                {visit.attachments.length > 0 && (
                  <div className="visit-attachments">
                    {visit.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={getAttachmentDownloadUrl(attachment.id)}
                        className="attachment-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {attachment.fileName}
                        <span className="attachment-size">
                          ({formatFileSize(attachment.fileSize)})
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 課題・相談 */}
      <div className="detail-section">
        <h2 className="section-title">課題・相談（Problem）</h2>
        <p className="detail-text">{currentReport.problem ?? '記載なし'}</p>
      </div>

      {/* 明日やること */}
      <div className="detail-section">
        <h2 className="section-title">明日やること（Plan）</h2>
        <p className="detail-text">{currentReport.plan ?? '記載なし'}</p>
      </div>

      {/* 承認履歴 */}
      {currentReport.approvalHistories.length > 0 && (
        <div className="detail-section">
          <h2 className="section-title">承認履歴</h2>
          <div className="history-list">
            {currentReport.approvalHistories.map((history) => (
              <div key={history.id} className="history-item">
                <div className="history-header">
                  <span className="history-date">
                    {formatDateTime(history.createdAt)}
                  </span>
                  <span className="history-approver">
                    {history.approver.name}
                  </span>
                  <span className={`history-action action-${history.action}`}>
                    {ACTION_LABELS[history.action] ?? history.action}
                  </span>
                </div>
                {history.comment && (
                  <p className="history-comment">{history.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* コメント */}
      {currentReport.comments.length > 0 && (
        <div className="detail-section">
          <h2 className="section-title">コメント</h2>
          <div className="comment-list">
            {currentReport.comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">
                    {comment.commenter.name}
                  </span>
                  <span className="comment-date">
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>
                <p className="comment-content">{comment.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 承認/差戻しボタン（上長向け） */}
      {canApprove() && (
        <div className="approval-actions">
          <p className="approval-notice">
            この日報の承認・差戻しを行うことができます。
          </p>
          <div className="approval-buttons">
            <button
              type="button"
              className="approve-button"
              disabled={isSubmitting}
            >
              承認
            </button>
            <button
              type="button"
              className="reject-button"
              disabled={isSubmitting}
            >
              差戻し
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

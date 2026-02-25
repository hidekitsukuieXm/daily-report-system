/**
 * 日報作成・編集画面
 * SCR-011, SCR-012
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import { useNavigate, useParams, useBlocker } from 'react-router-dom';

import {
  deleteAttachment,
  uploadAttachment,
  validateAttachment,
} from '@/lib/api/attachments';
import { getCustomers } from '@/lib/api/customers';
import { getVisitResults } from '@/lib/api/masters';
import type { VisitResultMaster } from '@/lib/api/masters';
import type { VisitResult, Customer } from '@/schemas/data';
import { useReportStore } from '@/stores/reports';

import './ReportFormPage.css';

type VisitFormData = {
  id?: number;
  customer_id: number;
  visit_time: string;
  content: string;
  result: VisitResult | '';
  attachments: {
    id: number;
    fileName: string;
    fileSize: number;
  }[];
  newFiles: File[];
};

export function ReportFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const reportId = id ? parseInt(id, 10) : null;

  const {
    currentReport,
    isLoading,
    isSubmitting,
    error,
    fetchReport,
    createReport,
    updateReport,
    submitReport,
    clearCurrentReport,
    clearError,
  } = useReportStore();

  // フォームデータ
  const [reportDate, setReportDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0] ?? '';
  });
  const [problem, setProblem] = useState('');
  const [plan, setPlan] = useState('');
  const [visits, setVisits] = useState<VisitFormData[]>([]);

  // マスタデータ
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visitResults, setVisitResults] = useState<VisitResultMaster[]>([]);

  // バリデーションエラー
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // 送信完了フラグ（離脱確認をスキップするため）
  const [isSubmitted, setIsSubmitted] = useState(false);

  // フォームの変更状態を追跡
  const isDirty = useMemo(() => {
    if (isSubmitted) return false;
    // 新規作成時：何か入力があればdirty
    if (!isEdit) {
      return (
        problem.length > 0 ||
        plan.length > 0 ||
        visits.some(
          (v) =>
            v.customer_id !== 0 ||
            v.content.length > 0 ||
            v.visit_time.length > 0 ||
            v.result !== '' ||
            v.newFiles.length > 0
        )
      );
    }
    // 編集時：元データと比較（簡略化のため、何か変更があればdirtyとみなす）
    if (!currentReport) return false;
    const originalProblem = currentReport.problem ?? '';
    const originalPlan = currentReport.plan ?? '';
    return (
      problem !== originalProblem ||
      plan !== originalPlan ||
      visits.some((v) => v.newFiles.length > 0)
    );
  }, [isEdit, isSubmitted, problem, plan, visits, currentReport]);

  // ブラウザのbeforeunloadイベントで離脱を警告
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        // 標準的なメッセージを表示（カスタムメッセージは無視される）
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // React Routerのナビゲーションブロック
  const blocker = useBlocker(
    useCallback(() => isDirty && !isSubmitting, [isDirty, isSubmitting])
  );

  // blockerがブロック状態の場合、確認ダイアログを表示
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const shouldProceed = confirm('入力内容が破棄されます。よろしいですか？');
      if (shouldProceed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // マスタデータの読み込み
  useEffect(() => {
    const loadMasters = async () => {
      try {
        const [customersData, visitResultsData] = await Promise.all([
          getCustomers({ is_active: true, per_page: 100 }),
          getVisitResults(),
        ]);
        setCustomers(customersData.items);
        setVisitResults(visitResultsData);
      } catch (err) {
        console.error('マスタデータの読み込みに失敗しました', err);
      }
    };
    void loadMasters();
  }, []);

  // 編集時のデータ読み込み
  useEffect(() => {
    if (isEdit && reportId) {
      void fetchReport(reportId);
    }
    return () => {
      clearCurrentReport();
    };
  }, [isEdit, reportId, fetchReport, clearCurrentReport]);

  // 編集データをフォームに反映
  useEffect(() => {
    if (isEdit && currentReport) {
      const dateStr =
        typeof currentReport.reportDate === 'string'
          ? currentReport.reportDate
          : (new Date(currentReport.reportDate).toISOString().split('T')[0] ??
            '');
      setReportDate(dateStr);
      setProblem(currentReport.problem ?? '');
      setPlan(currentReport.plan ?? '');
      setVisits(
        currentReport.visitRecords.map((v) => ({
          id: v.id,
          customer_id: v.customerId,
          visit_time: v.visitTime
            ? new Date(v.visitTime).toTimeString().slice(0, 5)
            : '',
          content: v.content,
          result: v.result ?? '',
          attachments: v.attachments.map((a) => ({
            id: a.id,
            fileName: a.fileName,
            fileSize: a.fileSize,
          })),
          newFiles: [],
        }))
      );
    }
  }, [isEdit, currentReport]);

  // 訪問記録を追加
  const handleAddVisit = () => {
    setVisits([
      ...visits,
      {
        customer_id: 0,
        visit_time: '',
        content: '',
        result: '' as VisitResult | '',
        attachments: [],
        newFiles: [],
      },
    ]);
  };

  // 訪問記録を削除
  const handleRemoveVisit = (index: number) => {
    setVisits(visits.filter((_, i) => i !== index));
  };

  // 訪問記録を更新
  const handleVisitChange = (
    index: number,
    field: keyof VisitFormData,
    value: unknown
  ) => {
    setVisits(
      visits.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  // ファイル選択
  const handleFileSelect = (index: number, files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    for (const file of Array.from(files)) {
      const validation = validateAttachment(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        alert(validation.error);
      }
    }

    const currentVisit = visits[index];
    if (validFiles.length > 0 && currentVisit) {
      handleVisitChange(index, 'newFiles', [
        ...currentVisit.newFiles,
        ...validFiles,
      ]);
    }
  };

  // 新しいファイルを削除
  const handleRemoveNewFile = (visitIndex: number, fileIndex: number) => {
    const visit = visits[visitIndex];
    if (visit) {
      handleVisitChange(
        visitIndex,
        'newFiles',
        visit.newFiles.filter((_, i) => i !== fileIndex)
      );
    }
  };

  // 既存の添付ファイルを削除
  const handleRemoveAttachment = async (
    visitIndex: number,
    attachmentId: number
  ) => {
    if (!confirm('この添付ファイルを削除しますか？')) return;

    try {
      await deleteAttachment(attachmentId);
      const visit = visits[visitIndex];
      if (visit) {
        handleVisitChange(
          visitIndex,
          'attachments',
          visit.attachments.filter((a) => a.id !== attachmentId)
        );
      }
    } catch (err) {
      console.error('添付ファイルの削除に失敗しました', err);
      alert('添付ファイルの削除に失敗しました');
    }
  };

  // バリデーション
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!reportDate) {
      errors.reportDate = '報告日を入力してください';
    }

    visits.forEach((visit, index) => {
      if (!visit.customer_id) {
        errors[`visit_${index}_customer`] = '顧客を選択してください';
      }
      if (!visit.content.trim()) {
        errors[`visit_${index}_content`] = '訪問内容を入力してください';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 下書き保存
  const handleSaveDraft = async () => {
    clearError();
    if (!validate()) return;

    try {
      if (isEdit && reportId) {
        await updateReport(reportId, { problem, plan });
        // 訪問記録の添付ファイルをアップロード
        await uploadNewFiles();
      } else {
        const report = await createReport({
          report_date: reportDate,
          problem,
          plan,
          visits: visits.map((v) => ({
            customer_id: v.customer_id,
            visit_time: v.visit_time || undefined,
            content: v.content,
            result: v.result || undefined,
          })),
        });
        // 新規作成時は訪問記録のIDを取得してからアップロード
        // 今回は簡略化のため、作成後に編集画面に遷移
        setIsSubmitted(true);
        void navigate(`/reports/${report.id}/edit`, { replace: true });
        return;
      }

      setIsSubmitted(true);
      void navigate('/reports');
    } catch (err) {
      console.error('保存に失敗しました', err);
    }
  };

  // 新しいファイルをアップロード
  const uploadNewFiles = async () => {
    for (const visit of visits) {
      if (visit.id && visit.newFiles.length > 0) {
        for (const file of visit.newFiles) {
          try {
            await uploadAttachment(visit.id, file);
          } catch (err) {
            console.error('ファイルのアップロードに失敗しました', err);
          }
        }
      }
    }
  };

  // 提出
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) return;

    if (visits.length === 0) {
      setValidationErrors({
        visits: '訪問記録を1件以上入力してください',
      });
      return;
    }

    if (!confirm('日報を提出しますか？提出後は編集できません。')) {
      return;
    }

    try {
      let targetReportId = reportId;

      if (isEdit && reportId) {
        await updateReport(reportId, { problem, plan });
        await uploadNewFiles();
      } else {
        const report = await createReport({
          report_date: reportDate,
          problem,
          plan,
          visits: visits.map((v) => ({
            customer_id: v.customer_id,
            visit_time: v.visit_time || undefined,
            content: v.content,
            result: v.result || undefined,
          })),
        });
        targetReportId = report.id;
      }

      if (targetReportId) {
        await submitReport(targetReportId);
      }

      setIsSubmitted(true);
      void navigate('/reports');
    } catch (err) {
      console.error('提出に失敗しました', err);
    }
  };

  // キャンセル
  const handleCancel = () => {
    void navigate('/reports');
  };

  if (isEdit && isLoading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="report-form-page">
      <h1 className="page-title">{isEdit ? '日報編集' : '日報作成'}</h1>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {isEdit && currentReport?.status === 'rejected' && (
        <div className="reject-notice">
          <strong>差戻し理由:</strong>
          <p>
            {currentReport.approvalHistories
              .filter((h) => h.action === 'rejected')
              .map((h) => h.comment)
              .join('\n') || '理由なし'}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2 className="section-title">基本情報</h2>
          <div className="form-group">
            <label htmlFor="reportDate" className="form-label">
              報告日 <span className="required">*</span>
            </label>
            <input
              id="reportDate"
              type="date"
              className={`form-input ${validationErrors.reportDate ? 'input-error' : ''}`}
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              disabled={isEdit}
            />
            {validationErrors.reportDate && (
              <p className="error-text">{validationErrors.reportDate}</p>
            )}
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <h2 className="section-title">訪問記録</h2>
            <button
              type="button"
              className="add-button"
              onClick={handleAddVisit}
            >
              ＋ 追加
            </button>
          </div>

          {validationErrors.visits && (
            <p className="error-text">{validationErrors.visits}</p>
          )}

          {visits.length === 0 ? (
            <p className="empty-visits">訪問記録がありません</p>
          ) : (
            visits.map((visit, index) => (
              <div key={index} className="visit-card">
                <div className="visit-header">
                  <span className="visit-number">No.{index + 1}</span>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => handleRemoveVisit(index)}
                  >
                    削除
                  </button>
                </div>

                <div className="visit-fields">
                  <div className="form-group">
                    <label className="form-label">
                      顧客 <span className="required">*</span>
                    </label>
                    <select
                      className={`form-select ${validationErrors[`visit_${index}_customer`] ? 'input-error' : ''}`}
                      value={visit.customer_id}
                      onChange={(e) =>
                        handleVisitChange(
                          index,
                          'customer_id',
                          parseInt(e.target.value, 10)
                        )
                      }
                    >
                      <option value={0}>選択してください</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {validationErrors[`visit_${index}_customer`] && (
                      <p className="error-text">
                        {validationErrors[`visit_${index}_customer`]}
                      </p>
                    )}
                  </div>

                  <div className="form-group form-group-small">
                    <label className="form-label">訪問時刻</label>
                    <input
                      type="time"
                      className="form-input"
                      value={visit.visit_time}
                      onChange={(e) =>
                        handleVisitChange(index, 'visit_time', e.target.value)
                      }
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">
                      訪問内容 <span className="required">*</span>
                    </label>
                    <textarea
                      className={`form-textarea ${validationErrors[`visit_${index}_content`] ? 'input-error' : ''}`}
                      rows={3}
                      value={visit.content}
                      onChange={(e) =>
                        handleVisitChange(index, 'content', e.target.value)
                      }
                    />
                    {validationErrors[`visit_${index}_content`] && (
                      <p className="error-text">
                        {validationErrors[`visit_${index}_content`]}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">結果</label>
                    <select
                      className="form-select"
                      value={visit.result}
                      onChange={(e) =>
                        handleVisitChange(index, 'result', e.target.value)
                      }
                    >
                      <option value="">選択してください</option>
                      {visitResults.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label">添付ファイル</label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => handleFileSelect(index, e.target.files)}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                    />
                    <p className="file-hint">
                      PDF, Word, Excel, PowerPoint, 画像（10MB以下）
                    </p>

                    {visit.attachments.length > 0 && (
                      <ul className="attachment-list">
                        {visit.attachments.map((a) => (
                          <li key={a.id} className="attachment-item">
                            <span className="attachment-name">
                              {a.fileName}
                            </span>
                            <button
                              type="button"
                              className="attachment-remove"
                              onClick={() =>
                                void handleRemoveAttachment(index, a.id)
                              }
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {visit.newFiles.length > 0 && (
                      <ul className="attachment-list new-files">
                        {visit.newFiles.map((f, fileIndex) => (
                          <li key={fileIndex} className="attachment-item">
                            <span className="attachment-name">{f.name}</span>
                            <button
                              type="button"
                              className="attachment-remove"
                              onClick={() =>
                                handleRemoveNewFile(index, fileIndex)
                              }
                            >
                              ×
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="form-section">
          <h2 className="section-title">課題・相談（Problem）</h2>
          <textarea
            className="form-textarea"
            rows={4}
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="課題や相談したいことを入力してください"
            maxLength={2000}
          />
        </div>

        <div className="form-section">
          <h2 className="section-title">明日やること（Plan）</h2>
          <textarea
            className="form-textarea"
            rows={4}
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
            placeholder="明日の予定を入力してください"
            maxLength={2000}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="draft-button"
            onClick={() => void handleSaveDraft()}
            disabled={isSubmitting}
          >
            下書き保存
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '送信中...' : '提出'}
          </button>
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}

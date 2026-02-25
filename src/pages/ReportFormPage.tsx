/**
 * 日報作成・編集画面
 * SCR-011, SCR-012
 */

import { useCallback, useEffect, useRef, useState } from 'react';
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
import type { VisitResult, Customer, ReportStatus } from '@/schemas/data';
import { useReportStore } from '@/stores/reports';

import './ReportFormPage.css';

// 編集可能なステータス
const EDITABLE_STATUSES: ReportStatus[] = ['draft', 'rejected'];

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
  isNew?: boolean;
};

type FormData = {
  reportDate: string;
  problem: string;
  plan: string;
  visits: VisitFormData[];
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
    addVisit,
    updateVisit,
    deleteVisit,
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

  // 編集不可エラー
  const [editError, setEditError] = useState<string | null>(null);

  // 変更検知用
  const initialDataRef = useRef<FormData | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 変更を検知する関数
  const checkChanges = useCallback(() => {
    if (!initialDataRef.current) {
      setHasChanges(false);
      return;
    }

    const initial = initialDataRef.current;
    const currentData: FormData = {
      reportDate,
      problem,
      plan,
      visits,
    };

    // 基本フィールドの比較
    if (
      initial.reportDate !== currentData.reportDate ||
      initial.problem !== currentData.problem ||
      initial.plan !== currentData.plan
    ) {
      setHasChanges(true);
      return;
    }

    // 訪問記録の比較（簡易比較）
    if (initial.visits.length !== currentData.visits.length) {
      setHasChanges(true);
      return;
    }

    for (let i = 0; i < initial.visits.length; i++) {
      const initVisit = initial.visits[i];
      const currVisit = currentData.visits[i];
      if (!initVisit || !currVisit) {
        setHasChanges(true);
        return;
      }
      if (
        initVisit.customer_id !== currVisit.customer_id ||
        initVisit.visit_time !== currVisit.visit_time ||
        initVisit.content !== currVisit.content ||
        initVisit.result !== currVisit.result ||
        currVisit.newFiles.length > 0
      ) {
        setHasChanges(true);
        return;
      }
    }

    // 新規訪問記録があるかチェック
    if (visits.some((v) => v.isNew)) {
      setHasChanges(true);
      return;
    }

    setHasChanges(false);
  }, [reportDate, problem, plan, visits]);

  // フォームデータが変更されたら変更検知を実行
  useEffect(() => {
    checkChanges();
  }, [checkChanges]);

  // ナビゲーションブロッカー
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges && currentLocation.pathname !== nextLocation.pathname
  );

  // ブロッカーダイアログの処理
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const confirmed = window.confirm(
        '未保存の変更があります。このページを離れますか？'
      );
      if (confirmed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // beforeunloadイベントハンドラ
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasChanges]);

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
      // 編集可能かチェック
      if (!EDITABLE_STATUSES.includes(currentReport.status)) {
        setEditError(
          'この日報は編集できません。下書きまたは差戻し状態の日報のみ編集可能です。'
        );
        return;
      }

      setEditError(null);

      const dateStr =
        typeof currentReport.reportDate === 'string'
          ? currentReport.reportDate
          : (new Date(currentReport.reportDate).toISOString().split('T')[0] ??
            '');
      const problemValue = currentReport.problem ?? '';
      const planValue = currentReport.plan ?? '';
      const visitsValue = currentReport.visitRecords.map((v) => ({
        id: v.id,
        customer_id: v.customerId,
        visit_time: v.visitTime
          ? new Date(v.visitTime).toTimeString().slice(0, 5)
          : '',
        content: v.content,
        result: v.result ?? ('' as VisitResult | ''),
        attachments: v.attachments.map((a) => ({
          id: a.id,
          fileName: a.fileName,
          fileSize: a.fileSize,
        })),
        newFiles: [],
      }));

      setReportDate(dateStr);
      setProblem(problemValue);
      setPlan(planValue);
      setVisits(visitsValue);

      // 初期データを保存（変更検知用）
      initialDataRef.current = {
        reportDate: dateStr,
        problem: problemValue,
        plan: planValue,
        visits: visitsValue.map((v) => ({ ...v, newFiles: [] })),
      };
    }
  }, [isEdit, currentReport]);

  // 新規作成時の初期データを設定
  useEffect(() => {
    if (!isEdit && !initialDataRef.current) {
      initialDataRef.current = {
        reportDate,
        problem: '',
        plan: '',
        visits: [],
      };
    }
  }, [isEdit, reportDate]);

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
        isNew: true,
      },
    ]);
  };

  // 訪問記録を削除
  const handleRemoveVisit = async (index: number) => {
    const visit = visits[index];
    if (!visit) return;

    // 既存の訪問記録（APIに保存済み）の場合はAPIで削除
    if (visit.id && !visit.isNew) {
      if (!confirm('この訪問記録を削除しますか？')) return;
      try {
        await deleteVisit(visit.id);
      } catch (err) {
        console.error('訪問記録の削除に失敗しました', err);
        alert('訪問記録の削除に失敗しました');
        return;
      }
    }

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

  // 訪問記録を保存（新規作成/更新）
  const saveVisits = async (targetReportId: number) => {
    for (const visit of visits) {
      const visitData = {
        customer_id: visit.customer_id,
        visit_time: visit.visit_time || undefined,
        content: visit.content,
        result: visit.result || undefined,
      };

      if (visit.isNew) {
        // 新規訪問記録を追加
        const newVisit = await addVisit(targetReportId, visitData);
        // 新しいファイルをアップロード
        for (const file of visit.newFiles) {
          try {
            await uploadAttachment(newVisit.id, file);
          } catch (err) {
            console.error('ファイルのアップロードに失敗しました', err);
          }
        }
      } else if (visit.id) {
        // 既存の訪問記録を更新
        await updateVisit(visit.id, visitData);
        // 新しいファイルをアップロード
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

  // 下書き保存
  const handleSaveDraft = async () => {
    clearError();
    if (!validate()) return;

    try {
      if (isEdit && reportId) {
        await updateReport(reportId, { problem, plan });
        await saveVisits(reportId);
      } else {
        const report = await createReport({
          report_date: reportDate,
          problem,
          plan,
          visits: visits
            .filter((v) => !v.isNew || v.customer_id)
            .map((v) => ({
              customer_id: v.customer_id,
              visit_time: v.visit_time || undefined,
              content: v.content,
              result: v.result || undefined,
            })),
        });
        // 新規作成時は編集画面に遷移
        void navigate(`/reports/${report.id}/edit`, { replace: true });
        return;
      }

      // 変更フラグをリセット
      setHasChanges(false);
      void navigate('/reports');
    } catch (err) {
      console.error('保存に失敗しました', err);
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

    const isRejected = currentReport?.status === 'rejected';
    const confirmMessage = isRejected
      ? '日報を再提出しますか？'
      : '日報を提出しますか？提出後は編集できません。';

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      let targetReportId = reportId;

      if (isEdit && reportId) {
        await updateReport(reportId, { problem, plan });
        await saveVisits(reportId);
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

      // 変更フラグをリセット
      setHasChanges(false);
      void navigate('/reports');
    } catch (err) {
      console.error('提出に失敗しました', err);
    }
  };

  // キャンセル
  const handleCancel = () => {
    if (hasChanges) {
      if (!confirm('未保存の変更があります。破棄しますか？')) {
        return;
      }
    }
    setHasChanges(false);
    void navigate('/reports');
  };

  // 戻る（編集不可の場合）
  const handleGoBack = () => {
    if (reportId) {
      void navigate(`/reports/${reportId}`);
    } else {
      void navigate('/reports');
    }
  };

  if (isEdit && isLoading) {
    return <div className="loading">読み込み中...</div>;
  }

  // 編集不可エラー表示
  if (editError) {
    return (
      <div className="report-form-page">
        <div className="error-container">
          <div className="error-message" role="alert">
            {editError}
          </div>
          <button type="button" className="back-button" onClick={handleGoBack}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  const isRejected = currentReport?.status === 'rejected';

  return (
    <div className="report-form-page">
      <h1 className="page-title">{isEdit ? '日報編集' : '日報作成'}</h1>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      {hasChanges && (
        <div className="unsaved-changes-notice">
          未保存の変更があります
        </div>
      )}

      {isEdit && isRejected && (
        <div className="reject-notice">
          <strong>差戻し理由:</strong>
          <p>
            {currentReport?.approvalHistories
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
              <div key={visit.id ?? `new-${index}`} className="visit-card">
                <div className="visit-header">
                  <span className="visit-number">
                    No.{index + 1}
                    {visit.isNew && <span className="new-badge">新規</span>}
                  </span>
                  <button
                    type="button"
                    className="remove-button"
                    onClick={() => void handleRemoveVisit(index)}
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
            {isSubmitting && '送信中...'}
            {!isSubmitting && isRejected && '再提出'}
            {!isSubmitting && !isRejected && '提出'}
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

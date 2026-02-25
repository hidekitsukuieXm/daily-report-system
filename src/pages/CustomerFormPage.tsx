/**
 * 顧客登録/編集画面
 * SCR-031: 顧客マスタ登録
 * SCR-032: 顧客マスタ編集
 */

import { useEffect, useState, useCallback } from 'react';

import { useNavigate, useParams, useBlocker, Link } from 'react-router-dom';

import {
  createCustomerRequestSchema,
  updateCustomerRequestSchema,
} from '@/schemas/api';
import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/schemas/api';
import { useAuthStore } from '@/stores/auth';
import { useCustomerStore } from '@/stores/customers';

import './CustomerFormPage.css';

type FormData = {
  name: string;
  address: string;
  phone: string;
  industry: string;
  is_active: boolean;
};

type FormErrors = {
  name?: string;
  address?: string;
  phone?: string;
  industry?: string;
};

export function CustomerFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  const { user, logout } = useAuthStore();
  const {
    currentCustomer,
    industries,
    isLoading,
    isSaving,
    isDeleting,
    error,
    fetchCustomer,
    fetchIndustries,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearCurrentCustomer,
    clearError,
  } = useCustomerStore();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    phone: '',
    industry: '',
    is_active: true,
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // フォームの初期化
  useEffect(() => {
    void fetchIndustries();

    if (isEditMode && id) {
      void fetchCustomer(parseInt(id, 10));
    } else {
      clearCurrentCustomer();
    }

    return () => {
      clearCurrentCustomer();
      clearError();
    };
  }, [
    id,
    isEditMode,
    fetchCustomer,
    fetchIndustries,
    clearCurrentCustomer,
    clearError,
  ]);

  // 編集モードで顧客データをフォームに反映
  useEffect(() => {
    if (isEditMode && currentCustomer) {
      setFormData({
        name: currentCustomer.name,
        address: currentCustomer.address ?? '',
        phone: currentCustomer.phone ?? '',
        industry: currentCustomer.industry ?? '',
        is_active: currentCustomer.isActive,
      });
      setIsDirty(false);
    }
  }, [isEditMode, currentCustomer]);

  // 離脱時の確認（React Router v6）
  const blocker = useBlocker(
    useCallback(() => isDirty && !isSaving, [isDirty, isSaving])
  );

  // beforeunload イベント（ブラウザの閉じる、リロード等）
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSaving) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, isSaving]);

  // フォームの入力変更
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    setIsDirty(true);

    // 入力時にエラーをクリア
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  // バリデーション
  const validateForm = (): boolean => {
    const schema = isEditMode
      ? updateCustomerRequestSchema
      : createCustomerRequestSchema;

    const dataToValidate: CreateCustomerRequest | UpdateCustomerRequest = {
      name: formData.name,
      address: formData.address || null,
      phone: formData.phone || null,
      industry: formData.industry || null,
      ...(isEditMode ? { is_active: formData.is_active } : {}),
    };

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const errors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        errors[field] = err.message;
      });
      setFormErrors(errors);
      return false;
    }

    setFormErrors({});
    return true;
  };

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode && id) {
        const updateData: UpdateCustomerRequest = {
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          industry: formData.industry || null,
          is_active: formData.is_active,
        };
        await updateCustomer(parseInt(id, 10), updateData);
      } else {
        const createData: CreateCustomerRequest = {
          name: formData.name,
          address: formData.address || null,
          phone: formData.phone || null,
          industry: formData.industry || null,
        };
        await createCustomer(createData);
      }

      setIsDirty(false);
      void navigate('/customers');
    } catch {
      // エラーはストアで処理される
    }
  };

  // 削除処理
  const handleDelete = async () => {
    if (!id) return;

    try {
      await deleteCustomer(parseInt(id, 10));
      setIsDirty(false);
      void navigate('/customers');
    } catch {
      // エラーはストアで処理される
    }
  };

  // キャンセル
  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('入力内容が破棄されます。よろしいですか？')) {
        setIsDirty(false);
        void navigate('/customers');
      }
    } else {
      void navigate('/customers');
    }
  };

  // ログアウト
  const handleLogout = async () => {
    await logout();
  };

  // ローディング中
  if (isLoading && isEditMode) {
    return (
      <div className="customer-form-page">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  // 編集モードで顧客が見つからない
  if (isEditMode && !isLoading && !currentCustomer) {
    return (
      <div className="customer-form-page">
        <div className="error-container">
          <h2>顧客が見つかりません</h2>
          <p>指定された顧客は存在しないか、削除された可能性があります。</p>
          <Link to="/customers" className="back-link">
            顧客一覧へ戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="customer-form-page">
      <header className="page-header">
        <h1 className="page-title">営業日報システム</h1>
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className="user-position">{user?.position.name}</span>
          <button className="logout-button" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </header>

      <main className="page-main">
        <div className="form-container">
          <div className="form-header">
            <h2>{isEditMode ? '顧客編集' : '顧客登録'}</h2>
            <Link to="/customers" className="back-link">
              ← 顧客一覧へ戻る
            </Link>
          </div>

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="customer-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label required">
                顧客名
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`form-input ${formErrors.name ? 'error' : ''}`}
                placeholder="例：株式会社サンプル"
                disabled={isSaving}
                maxLength={200}
              />
              {formErrors.name && (
                <span className="field-error">{formErrors.name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="industry" className="form-label">
                業種
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className={`form-select ${formErrors.industry ? 'error' : ''}`}
                disabled={isSaving}
              >
                <option value="">選択してください</option>
                {industries.map((ind) => (
                  <option key={ind.value} value={ind.value}>
                    {ind.label}
                  </option>
                ))}
              </select>
              {formErrors.industry && (
                <span className="field-error">{formErrors.industry}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">
                住所
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`form-textarea ${formErrors.address ? 'error' : ''}`}
                placeholder="例：東京都千代田区..."
                disabled={isSaving}
                rows={3}
                maxLength={500}
              />
              {formErrors.address && (
                <span className="field-error">{formErrors.address}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                電話番号
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`form-input ${formErrors.phone ? 'error' : ''}`}
                placeholder="例：03-1234-5678"
                disabled={isSaving}
                maxLength={20}
              />
              {formErrors.phone && (
                <span className="field-error">{formErrors.phone}</span>
              )}
            </div>

            {isEditMode && (
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    disabled={isSaving}
                  />
                  <span>有効</span>
                </label>
                <p className="field-hint">
                  無効にすると、訪問記録の顧客選択に表示されなくなります
                </p>
              </div>
            )}

            <div className="form-actions">
              <div className="action-left">
                {isEditMode && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isSaving || isDeleting}
                  >
                    {isDeleting ? '削除中...' : '削除'}
                  </button>
                )}
              </div>
              <div className="action-right">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>

      {/* 削除確認ダイアログ */}
      {showDeleteDialog && (
        <div
          className="dialog-overlay"
          onClick={() => setShowDeleteDialog(false)}
        >
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="dialog-title">顧客の削除</h3>
            <p className="dialog-message">
              「{currentCustomer?.name}」を削除してもよろしいですか？
              <br />
              この操作は取り消せません。
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ナビゲーションブロッカーダイアログ */}
      {blocker.state === 'blocked' && (
        <div className="dialog-overlay">
          <div className="dialog">
            <h3 className="dialog-title">ページを離れますか？</h3>
            <p className="dialog-message">
              入力内容が保存されていません。このページを離れると、変更内容が破棄されます。
            </p>
            <div className="dialog-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => blocker.reset?.()}
              >
                このページに留まる
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => blocker.proceed?.()}
              >
                ページを離れる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

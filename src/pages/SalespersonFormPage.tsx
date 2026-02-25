/**
 * 営業担当者登録/編集画面
 * SCR-041 (登録) / SCR-042 (編集)
 */

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { getPositions, type PositionMaster } from '@/lib/api/masters';
import {
  createSalesperson,
  getSalesperson,
  getSalespersons,
  updateSalesperson,
} from '@/lib/api/salespersons';
import type {
  CreateSalespersonRequest,
  UpdateSalespersonRequest,
} from '@/schemas/api';
import { useAuthStore } from '@/stores/auth';

import './SalespersonFormPage.css';

type ValidationErrors = {
  name?: string;
  email?: string;
  password?: string;
  position_id?: string;
  manager_id?: string;
};

export function SalespersonFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuthStore();

  const isEditMode = !!id;
  const salespersonId = id ? parseInt(id, 10) : null;

  // 権限チェック - 部長のみアクセス可
  const positionLevel = user?.position.level ?? 1;
  const canAccess = positionLevel >= 3;

  // フォーム状態
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [positionId, setPositionId] = useState('');
  const [managerId, setManagerId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [resetPassword, setResetPassword] = useState(false);

  // マスタデータ
  const [positions, setPositions] = useState<PositionMaster[]>([]);
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([]);

  // 状態
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {}
  );

  // 権限チェック - 部長以外はダッシュボードへリダイレクト
  useEffect(() => {
    if (!canAccess) {
      void navigate('/dashboard');
    }
  }, [canAccess, navigate]);

  // マスタデータ取得
  useEffect(() => {
    const loadMasters = async () => {
      try {
        // 役職一覧取得
        const positionsData = await getPositions();
        setPositions(positionsData);

        // 上長候補（課長以上）の取得
        const salespersonsData = await getSalespersons({
          is_active: true,
        });
        // 課長以上のみを上長候補として設定
        const managerCandidates = salespersonsData.items
          .filter((s) => s.position.level >= 2)
          .map((s) => ({ id: s.id, name: s.name }));
        setManagers(managerCandidates);
      } catch {
        // エラーは無視して空のリストを使用
      }
    };
    void loadMasters();
  }, []);

  // 編集モード時に既存データを取得
  useEffect(() => {
    if (!isEditMode || !salespersonId) return;

    const loadSalesperson = async () => {
      setIsFetching(true);
      try {
        const data = await getSalesperson(salespersonId);
        setName(data.name);
        setEmail(data.email);
        setPositionId(String(data.position.id));
        setManagerId(data.managerId ? String(data.managerId) : '');
        setIsActive(data.isActive);
      } catch {
        setError('営業担当者情報の取得に失敗しました');
      } finally {
        setIsFetching(false);
      }
    };
    void loadSalesperson();
  }, [isEditMode, salespersonId]);

  // バリデーション
  const validate = (): boolean => {
    const errors: ValidationErrors = {};

    if (!name.trim()) {
      errors.name = '氏名を入力してください';
    } else if (name.length > 100) {
      errors.name = '氏名は100文字以内で入力してください';
    }

    if (!email.trim()) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    // 新規作成時はパスワード必須
    if (!isEditMode) {
      if (!password) {
        errors.password = 'パスワードを入力してください';
      } else if (password.length < 8) {
        errors.password = 'パスワードは8文字以上で入力してください';
      }
    }

    if (!positionId) {
      errors.position_id = '役職を選択してください';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 送信処理
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isEditMode && salespersonId) {
        // 更新
        const data: UpdateSalespersonRequest = {
          name,
          email,
          position_id: parseInt(positionId, 10),
          manager_id: managerId ? parseInt(managerId, 10) : null,
          is_active: isActive,
        };
        if (resetPassword) {
          data.reset_password = true;
        }
        await updateSalesperson(salespersonId, data);
      } else {
        // 新規作成
        const data: CreateSalespersonRequest = {
          name,
          email,
          password,
          position_id: parseInt(positionId, 10),
          manager_id: managerId ? parseInt(managerId, 10) : null,
        };
        await createSalesperson(data);
      }

      // 成功時は一覧へ遷移
      void navigate('/salespersons');
    } catch (err) {
      // APIエラーのハンドリング
      const apiError = err as {
        response?: { data?: { error?: { code?: string; message?: string } } };
      };
      const errorCode = apiError.response?.data?.error?.code;
      if (errorCode === 'DUPLICATE_EMAIL') {
        setValidationErrors({
          email: 'このメールアドレスは既に登録されています',
        });
      } else {
        setError(
          apiError.response?.data?.error?.message ??
            '保存に失敗しました。再度お試しください'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // キャンセル
  const handleCancel = () => {
    void navigate('/salespersons');
  };

  // 権限がない場合は何も表示しない
  if (!canAccess) {
    return null;
  }

  // データ読み込み中
  if (isFetching) {
    return (
      <div className="salesperson-form-page">
        <div className="loading">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="salesperson-form-page">
      <div className="page-header">
        <h1 className="page-title">
          {isEditMode ? '営業担当者編集' : '営業担当者登録'}
        </h1>
      </div>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <form className="salesperson-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h2 className="section-title">基本情報</h2>

          <div className="form-group">
            <label htmlFor="name" className="form-label required">
              氏名
            </label>
            <input
              id="name"
              type="text"
              className={`form-input ${validationErrors.name ? 'input-error' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="氏名を入力"
              disabled={isLoading}
              aria-invalid={!!validationErrors.name}
              aria-describedby={
                validationErrors.name ? 'name-error' : undefined
              }
            />
            {validationErrors.name && (
              <p id="name-error" className="field-error">
                {validationErrors.name}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label required">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              disabled={isLoading}
              aria-invalid={!!validationErrors.email}
              aria-describedby={
                validationErrors.email ? 'email-error' : undefined
              }
            />
            {validationErrors.email && (
              <p id="email-error" className="field-error">
                {validationErrors.email}
              </p>
            )}
          </div>

          {!isEditMode && (
            <div className="form-group">
              <label htmlFor="password" className="form-label required">
                初期パスワード
              </label>
              <input
                id="password"
                type="password"
                className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上"
                disabled={isLoading}
                aria-invalid={!!validationErrors.password}
                aria-describedby={
                  validationErrors.password ? 'password-error' : undefined
                }
              />
              {validationErrors.password && (
                <p id="password-error" className="field-error">
                  {validationErrors.password}
                </p>
              )}
            </div>
          )}

          {isEditMode && (
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={resetPassword}
                  onChange={(e) => setResetPassword(e.target.checked)}
                  disabled={isLoading}
                />
                <span>パスワードをリセットする</span>
              </label>
            </div>
          )}
        </div>

        <div className="form-section">
          <h2 className="section-title">組織情報</h2>

          <div className="form-group">
            <label htmlFor="position" className="form-label required">
              役職
            </label>
            <select
              id="position"
              className={`form-select ${validationErrors.position_id ? 'input-error' : ''}`}
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              disabled={isLoading}
              aria-invalid={!!validationErrors.position_id}
              aria-describedby={
                validationErrors.position_id ? 'position-error' : undefined
              }
            >
              <option value="">選択してください</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
            {validationErrors.position_id && (
              <p id="position-error" className="field-error">
                {validationErrors.position_id}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="manager" className="form-label">
              上長
            </label>
            <select
              id="manager"
              className={`form-select ${validationErrors.manager_id ? 'input-error' : ''}`}
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              disabled={isLoading}
              aria-invalid={!!validationErrors.manager_id}
            >
              <option value="">なし</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {isEditMode && (
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isLoading}
                />
                <span>有効</span>
              </label>
              <p className="field-hint">
                無効にすると、この担当者はログインできなくなります
              </p>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
            disabled={isLoading}
          >
            キャンセル
          </button>
          <button type="submit" className="submit-button" disabled={isLoading}>
            {isLoading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}

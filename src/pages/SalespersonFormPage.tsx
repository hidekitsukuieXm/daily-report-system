/**
 * 営業担当者登録・編集画面
 * SCR-041, SCR-042
 */

import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import {
  getSalesperson,
  getSalespersonPositions,
  getManagers,
  getDirectors,
  createSalesperson,
  updateSalesperson,
} from '@/lib/api/salespersons';
import type {
  CreateSalespersonRequest,
  UpdateSalespersonRequest,
} from '@/schemas/api';
import type { Position, Salesperson } from '@/schemas/data';
import { useAuthStore } from '@/stores/auth';

import './SalespersonFormPage.css';

const POSITION_LEVEL = {
  STAFF: 1,
  MANAGER: 2,
  DIRECTOR: 3,
} as const;

export function SalespersonFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const salespersonId = id ? parseInt(id, 10) : null;

  const { user } = useAuthStore();
  const positionLevel = user?.position.level ?? 1;
  const isDirector = positionLevel === POSITION_LEVEL.DIRECTOR;

  // フォームデータ
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [positionId, setPositionId] = useState<number>(0);
  const [managerId, setManagerId] = useState<number | null>(null);
  const [directorId, setDirectorId] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [resetPassword, setResetPassword] = useState(false);

  // マスタデータ
  const [positions, setPositions] = useState<Position[]>([]);
  const [managers, setManagers] = useState<Pick<Salesperson, 'id' | 'name'>[]>(
    []
  );
  const [directors, setDirectors] = useState<
    Pick<Salesperson, 'id' | 'name'>[]
  >([]);

  // UI状態
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // マスタデータの読み込み
  const loadMasters = useCallback(async () => {
    try {
      const [positionsData, managersData, directorsData] = await Promise.all([
        getSalespersonPositions(),
        getManagers(),
        getDirectors(),
      ]);
      setPositions(positionsData);
      setManagers(managersData);
      setDirectors(directorsData);
    } catch (err) {
      console.error('マスタデータの読み込みに失敗しました', err);
    }
  }, []);

  // 編集時のデータ読み込み
  const loadSalesperson = useCallback(async () => {
    if (!salespersonId) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await getSalesperson(salespersonId);
      setName(data.name);
      setEmail(data.email);
      setPositionId(data.positionId);
      setManagerId(data.managerId);
      setDirectorId(data.directorId);
      setIsActive(data.isActive);
    } catch (err) {
      setError('営業担当者の取得に失敗しました');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [salespersonId]);

  // 初期読み込み
  useEffect(() => {
    if (!isDirector) {
      void navigate('/salespersons');
      return;
    }
    void loadMasters();
    if (isEdit) {
      void loadSalesperson();
    }
  }, [isDirector, navigate, loadMasters, isEdit, loadSalesperson]);

  // バリデーション
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

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

    if (!positionId) {
      errors.positionId = '役職を選択してください';
    }

    if (!isEdit && !password) {
      errors.password = 'パスワードを入力してください';
    } else if (password && password.length < 8) {
      errors.password = 'パスワードは8文字以上で入力してください';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (isEdit && salespersonId) {
        const data: UpdateSalespersonRequest = {
          name,
          email,
          position_id: positionId,
          manager_id: managerId,
          director_id: directorId,
          is_active: isActive,
          reset_password: resetPassword,
        };
        await updateSalesperson(salespersonId, data);
      } else {
        const data: CreateSalespersonRequest = {
          name,
          email,
          position_id: positionId,
          manager_id: managerId,
          director_id: directorId,
          password,
        };
        await createSalesperson(data);
      }

      void navigate('/salespersons');
    } catch (err: unknown) {
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { error?: { code?: string } } } })
          .response?.data?.error?.code === 'string'
      ) {
        const code = (
          err as { response: { data: { error: { code: string } } } }
        ).response.data.error.code;
        if (code === 'DUPLICATE_EMAIL') {
          setError('このメールアドレスは既に登録されています');
        } else {
          setError('保存に失敗しました');
        }
      } else {
        setError('保存に失敗しました');
      }
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // キャンセル
  const handleCancel = () => {
    if (name || email || positionId || password) {
      if (!confirm('入力内容が破棄されます。よろしいですか？')) {
        return;
      }
    }
    void navigate('/salespersons');
  };

  if (!isDirector) {
    return null;
  }

  if (isEdit && isLoading) {
    return <div className="loading">読み込み中...</div>;
  }

  return (
    <div className="salesperson-form-page">
      <h1 className="page-title">
        {isEdit ? '営業担当者編集' : '営業担当者登録'}
      </h1>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2 className="section-title">基本情報</h2>

          <div className="form-group">
            <label htmlFor="name" className="form-label">
              氏名 <span className="required">*</span>
            </label>
            <input
              id="name"
              type="text"
              className={`form-input ${validationErrors.name ? 'input-error' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田 太郎"
              maxLength={100}
            />
            {validationErrors.name && (
              <p className="error-text">{validationErrors.name}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              メールアドレス <span className="required">*</span>
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="yamada@example.com"
              maxLength={255}
            />
            {validationErrors.email && (
              <p className="error-text">{validationErrors.email}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="positionId" className="form-label">
              役職 <span className="required">*</span>
            </label>
            <select
              id="positionId"
              className={`form-select ${validationErrors.positionId ? 'input-error' : ''}`}
              value={positionId}
              onChange={(e) => setPositionId(parseInt(e.target.value, 10))}
            >
              <option value={0}>選択してください</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
            {validationErrors.positionId && (
              <p className="error-text">{validationErrors.positionId}</p>
            )}
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">上長設定</h2>

          <div className="form-group">
            <label htmlFor="managerId" className="form-label">
              直属上長（課長）
            </label>
            <select
              id="managerId"
              className="form-select"
              value={managerId ?? ''}
              onChange={(e) =>
                setManagerId(
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
            >
              <option value="">なし</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="directorId" className="form-label">
              2次上長（部長）
            </label>
            <select
              id="directorId"
              className="form-select"
              value={directorId ?? ''}
              onChange={(e) =>
                setDirectorId(
                  e.target.value ? parseInt(e.target.value, 10) : null
                )
              }
            >
              <option value="">なし</option>
              {directors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2 className="section-title">
            {isEdit ? 'パスワード変更' : 'パスワード設定'}
          </h2>

          {isEdit ? (
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={resetPassword}
                  onChange={(e) => setResetPassword(e.target.checked)}
                />
                パスワードをリセットする
              </label>
              <p className="hint-text">
                チェックを入れると、新しい仮パスワードが発行されます
              </p>
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                初期パスワード <span className="required">*</span>
              </label>
              <input
                id="password"
                type="password"
                className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8文字以上"
                maxLength={100}
              />
              {validationErrors.password && (
                <p className="error-text">{validationErrors.password}</p>
              )}
            </div>
          )}
        </div>

        {isEdit && (
          <div className="form-section">
            <h2 className="section-title">状態</h2>
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                有効
              </label>
              <p className="hint-text">
                無効にすると、この担当者はログインできなくなります
              </p>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '保存中...' : '保存'}
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

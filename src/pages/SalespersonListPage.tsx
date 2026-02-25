/**
 * 営業担当者一覧画面
 * SCR-040
 */

import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { getPositions, type PositionMaster } from '@/lib/api/masters';
import type { SalespersonSearchQuery } from '@/schemas/api';
import { useAuthStore } from '@/stores/auth';
import { useSalespersonStore } from '@/stores/salespersons';

import './SalespersonListPage.css';

const STATUS_OPTIONS = [
  { value: '', label: '全て' },
  { value: 'true', label: '有効' },
  { value: 'false', label: '無効' },
];

export function SalespersonListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    salespersons,
    pagination,
    isLoading,
    error,
    fetchSalespersons,
    clearError,
  } = useSalespersonStore();

  // 検索条件
  const [name, setName] = useState('');
  const [positionId, setPositionId] = useState('');
  const [isActive, setIsActive] = useState('');

  // 役職マスタ
  const [positions, setPositions] = useState<PositionMaster[]>([]);

  const positionLevel = user?.position.level ?? 1;
  const canView = positionLevel >= 2; // 課長・部長のみ閲覧可
  const canCreateOrEdit = positionLevel >= 3; // 部長のみ登録・編集可

  // 権限チェック - 担当者はアクセス不可
  useEffect(() => {
    if (!canView) {
      void navigate('/dashboard');
    }
  }, [canView, navigate]);

  // 役職マスタを取得
  useEffect(() => {
    const loadPositions = async () => {
      try {
        const data = await getPositions();
        setPositions(data);
      } catch {
        // エラーは無視して空のリストを使用
      }
    };
    void loadPositions();
  }, []);

  // 初期読み込み
  useEffect(() => {
    if (canView) {
      void fetchSalespersons();
    }
  }, [canView, fetchSalespersons]);

  // 検索実行
  const handleSearch = () => {
    clearError();
    const query: Partial<SalespersonSearchQuery> = {
      page: 1,
    };
    if (name) query.name = name;
    if (positionId) query.position_id = parseInt(positionId, 10);
    if (isActive) query.is_active = isActive === 'true';

    void fetchSalespersons(query);
  };

  // 検索条件クリア
  const handleClear = () => {
    setName('');
    setPositionId('');
    setIsActive('');
    clearError();
    void fetchSalespersons({ page: 1 });
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    void fetchSalespersons({ page });
  };

  // 営業担当者編集へ遷移
  const handleEdit = (id: number) => {
    void navigate(`/salespersons/${id}/edit`);
  };

  // 新規登録へ遷移
  const handleCreate = () => {
    void navigate('/salespersons/new');
  };

  // 権限がない場合は何も表示しない
  if (!canView) {
    return null;
  }

  return (
    <div className="salesperson-list-page">
      <div className="page-header">
        <h1 className="page-title">営業担当者マスタ一覧</h1>
        {canCreateOrEdit && (
          <button
            type="button"
            className="create-button"
            onClick={handleCreate}
          >
            新規登録
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
            <label htmlFor="name" className="field-label">
              氏名
            </label>
            <input
              id="name"
              type="text"
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="氏名を入力"
            />
          </div>

          <div className="search-field">
            <label htmlFor="position" className="field-label">
              役職
            </label>
            <select
              id="position"
              className="field-select"
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
            >
              <option value="">全て</option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.name}
                </option>
              ))}
            </select>
          </div>

          <div className="search-field">
            <label htmlFor="status" className="field-label">
              状態
            </label>
            <select
              id="status"
              className="field-select"
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
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

      <div className="salesperson-table-container">
        <div className="result-count">
          検索結果: {pagination?.totalCount ?? 0}件
        </div>

        {isLoading && <div className="loading">読み込み中...</div>}
        {!isLoading && salespersons.length === 0 && (
          <div className="empty-message">営業担当者がありません</div>
        )}
        {!isLoading && salespersons.length > 0 && (
          <>
            <table className="salesperson-table">
              <thead>
                <tr>
                  <th>氏名</th>
                  <th>メールアドレス</th>
                  <th>役職</th>
                  <th>上長</th>
                  <th>状態</th>
                  {canCreateOrEdit && <th>操作</th>}
                </tr>
              </thead>
              <tbody>
                {salespersons.map((salesperson) => (
                  <tr
                    key={salesperson.id}
                    onClick={() =>
                      canCreateOrEdit && handleEdit(salesperson.id)
                    }
                    className={canCreateOrEdit ? 'clickable-row' : ''}
                  >
                    <td>{salesperson.name}</td>
                    <td>{salesperson.email}</td>
                    <td>{salesperson.position.name}</td>
                    <td>{salesperson.manager?.name ?? '-'}</td>
                    <td>
                      <span
                        className={`status-badge ${salesperson.isActive ? 'status-active' : 'status-inactive'}`}
                      >
                        {salesperson.isActive ? '有効' : '無効'}
                      </span>
                    </td>
                    {canCreateOrEdit && (
                      <td>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(salesperson.id);
                          }}
                        >
                          編集
                        </button>
                      </td>
                    )}
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

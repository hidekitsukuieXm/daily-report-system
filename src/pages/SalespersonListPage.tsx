/**
 * 営業担当者一覧画面
 * SCR-040
 */

import { useCallback, useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import {
  getSalespersons,
  getSalespersonPositions,
} from '@/lib/api/salespersons';
import type { SalespersonSearchQuery } from '@/schemas/api';
import type {
  SalespersonWithRelations,
  Pagination,
  Position,
} from '@/schemas/data';
import { useAuthStore } from '@/stores/auth';

import './SalespersonListPage.css';

const POSITION_LEVEL = {
  STAFF: 1,
  MANAGER: 2,
  DIRECTOR: 3,
} as const;

export function SalespersonListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // データ
  const [salespersons, setSalespersons] = useState<SalespersonWithRelations[]>(
    []
  );
  const [positions, setPositions] = useState<Position[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 検索条件
  const [nameFilter, setNameFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');

  const positionLevel = user?.position.level ?? 1;
  const isDirector = positionLevel === POSITION_LEVEL.DIRECTOR;
  const canAccess =
    positionLevel === POSITION_LEVEL.MANAGER ||
    positionLevel === POSITION_LEVEL.DIRECTOR;

  // 営業担当者一覧取得
  const fetchSalespersons = useCallback(
    async (query?: Partial<SalespersonSearchQuery>) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getSalespersons(query);
        setSalespersons(result.items);
        setPagination(result.pagination);
      } catch (err) {
        setError('営業担当者の取得に失敗しました');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 役職一覧取得
  const fetchPositions = useCallback(async () => {
    try {
      const result = await getSalespersonPositions();
      setPositions(result);
    } catch (err) {
      console.error('役職一覧の取得に失敗しました', err);
    }
  }, []);

  // 初期読み込み
  useEffect(() => {
    if (!canAccess) {
      void navigate('/dashboard');
      return;
    }
    void fetchSalespersons();
    void fetchPositions();
  }, [canAccess, navigate, fetchSalespersons, fetchPositions]);

  // 検索実行
  const handleSearch = () => {
    setError(null);
    const query: Partial<SalespersonSearchQuery> = {
      page: 1,
    };
    if (nameFilter) query.name = nameFilter;
    if (positionFilter) query.position_id = Number(positionFilter);
    if (isActiveFilter) query.is_active = isActiveFilter === 'true';

    void fetchSalespersons(query);
  };

  // 検索条件クリア
  const handleClear = () => {
    setNameFilter('');
    setPositionFilter('');
    setIsActiveFilter('');
    setError(null);
    void fetchSalespersons({ page: 1 });
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    const query: Partial<SalespersonSearchQuery> = { page };
    if (nameFilter) query.name = nameFilter;
    if (positionFilter) query.position_id = Number(positionFilter);
    if (isActiveFilter) query.is_active = isActiveFilter === 'true';
    void fetchSalespersons(query);
  };

  // 詳細/編集へ遷移
  const handleEdit = (id: number) => {
    void navigate(`/salespersons/${id}/edit`);
  };

  // 新規作成へ遷移
  const handleCreate = () => {
    void navigate('/salespersons/new');
  };

  if (!canAccess) {
    return null;
  }

  return (
    <div className="salesperson-list-page">
      <div className="page-header">
        <h1 className="page-title">営業担当者一覧</h1>
        {isDirector && (
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
              placeholder="氏名で検索"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
            />
          </div>

          <div className="search-field">
            <label htmlFor="position" className="field-label">
              役職
            </label>
            <select
              id="position"
              className="field-select"
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
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
            <label htmlFor="isActive" className="field-label">
              状態
            </label>
            <select
              id="isActive"
              className="field-select"
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
            >
              <option value="">全て</option>
              <option value="true">有効</option>
              <option value="false">無効</option>
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
          <div className="empty-message">営業担当者がいません</div>
        )}
        {!isLoading && salespersons.length > 0 && (
          <>
            <table className="salesperson-table">
              <thead>
                <tr>
                  <th>氏名</th>
                  <th>メールアドレス</th>
                  <th>役職</th>
                  <th>直属上長</th>
                  <th>状態</th>
                  {isDirector && <th>操作</th>}
                </tr>
              </thead>
              <tbody>
                {salespersons.map((person) => (
                  <tr
                    key={person.id}
                    className={!person.isActive ? 'inactive-row' : ''}
                  >
                    <td>{person.name}</td>
                    <td>{person.email}</td>
                    <td>{person.position.name}</td>
                    <td>{person.manager?.name ?? '-'}</td>
                    <td>
                      <span
                        className={`status-badge ${person.isActive ? 'status-active' : 'status-inactive'}`}
                      >
                        {person.isActive ? '有効' : '無効'}
                      </span>
                    </td>
                    {isDirector && (
                      <td>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={() => handleEdit(person.id)}
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

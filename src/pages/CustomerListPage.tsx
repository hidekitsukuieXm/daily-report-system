/**
 * 顧客一覧画面
 * SCR-030
 */

import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { getIndustries, type IndustryMaster } from '@/lib/api/masters';
import type { CustomerSearchQuery } from '@/schemas/api';
import { useAuthStore } from '@/stores/auth';
import { useCustomerStore } from '@/stores/customers';

import './CustomerListPage.css';

const STATUS_OPTIONS = [
  { value: '', label: '全て' },
  { value: 'true', label: '有効' },
  { value: 'false', label: '無効' },
];

export function CustomerListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { customers, pagination, isLoading, error, fetchCustomers, clearError } =
    useCustomerStore();

  // 検索条件
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [isActive, setIsActive] = useState('');

  // 業種マスタ
  const [industries, setIndustries] = useState<IndustryMaster[]>([]);

  const positionLevel = user?.position.level ?? 1;
  const canCreateOrEdit = positionLevel >= 2; // 課長・部長のみ

  // 業種マスタを取得
  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const data = await getIndustries();
        setIndustries(data);
      } catch {
        // エラーは無視して空のリストを使用
      }
    };
    void loadIndustries();
  }, []);

  // 初期読み込み
  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  // 検索実行
  const handleSearch = () => {
    clearError();
    const query: Partial<CustomerSearchQuery> = {
      page: 1,
    };
    if (name) query.name = name;
    if (industry) query.industry = industry;
    if (isActive) query.is_active = isActive === 'true';

    void fetchCustomers(query);
  };

  // 検索条件クリア
  const handleClear = () => {
    setName('');
    setIndustry('');
    setIsActive('');
    clearError();
    void fetchCustomers({ page: 1 });
  };

  // ページ変更
  const handlePageChange = (page: number) => {
    void fetchCustomers({ page });
  };

  // 顧客編集へ遷移
  const handleEdit = (id: number) => {
    void navigate(`/customers/${id}/edit`);
  };

  // 新規登録へ遷移
  const handleCreate = () => {
    void navigate('/customers/new');
  };

  return (
    <div className="customer-list-page">
      <div className="page-header">
        <h1 className="page-title">顧客マスタ一覧</h1>
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
              顧客名
            </label>
            <input
              id="name"
              type="text"
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="顧客名を入力"
            />
          </div>

          <div className="search-field">
            <label htmlFor="industry" className="field-label">
              業種
            </label>
            <select
              id="industry"
              className="field-select"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            >
              <option value="">全て</option>
              {industries.map((ind) => (
                <option key={ind.code} value={ind.name}>
                  {ind.name}
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

      <div className="customer-table-container">
        <div className="result-count">
          検索結果: {pagination?.totalCount ?? 0}件
        </div>

        {isLoading && <div className="loading">読み込み中...</div>}
        {!isLoading && customers.length === 0 && (
          <div className="empty-message">顧客がありません</div>
        )}
        {!isLoading && customers.length > 0 && (
          <>
            <table className="customer-table">
              <thead>
                <tr>
                  <th>顧客名</th>
                  <th>業種</th>
                  <th>電話番号</th>
                  <th>状態</th>
                  {canCreateOrEdit && <th>操作</th>}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => canCreateOrEdit && handleEdit(customer.id)}
                    className={canCreateOrEdit ? 'clickable-row' : ''}
                  >
                    <td>{customer.name}</td>
                    <td>{customer.industry ?? '-'}</td>
                    <td>{customer.phone ?? '-'}</td>
                    <td>
                      <span
                        className={`status-badge ${customer.isActive ? 'status-active' : 'status-inactive'}`}
                      >
                        {customer.isActive ? '有効' : '無効'}
                      </span>
                    </td>
                    {canCreateOrEdit && (
                      <td>
                        <button
                          type="button"
                          className="edit-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(customer.id);
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

/**
 * 顧客一覧コンポーネント
 */

import { useEffect, useState, useCallback } from 'react';

import type {
  CustomerSearchQuery,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/schemas/api';
import type { Customer } from '@/schemas/data';
import { useAuthStore } from '@/stores/auth';
import { useCustomersStore } from '@/stores/customers';

import { CustomerDialog } from './CustomerDialog';
import { CustomerSearchForm } from './CustomerSearchForm';
import { Pagination } from './Pagination';

export function CustomerList() {
  const {
    customers,
    pagination,
    isLoading,
    error,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    clearError,
  } = useCustomersStore();

  const { user } = useAuthStore();
  const canEdit = user && user.position.level >= 2; // 課長以上

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    void fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = useCallback(
    (query: Partial<CustomerSearchQuery>) => {
      void fetchCustomers({ ...query, page: 1 });
    },
    [fetchCustomers]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      void fetchCustomers({ page });
    },
    [fetchCustomers]
  );

  const handleOpenCreate = useCallback(() => {
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedCustomer(null);
  }, []);

  const handleSave = useCallback(
    async (data: CreateCustomerRequest | UpdateCustomerRequest) => {
      setIsSaving(true);
      try {
        if (selectedCustomer) {
          await updateCustomer(
            selectedCustomer.id,
            data as UpdateCustomerRequest
          );
        } else {
          await createCustomer(data as CreateCustomerRequest);
        }
        handleCloseDialog();
      } finally {
        setIsSaving(false);
      }
    },
    [selectedCustomer, createCustomer, updateCustomer, handleCloseDialog]
  );

  const handleDelete = useCallback(
    async (customer: Customer) => {
      if (!window.confirm(`「${customer.name}」を無効化しますか？`)) {
        return;
      }

      await deleteCustomer(customer.id);
    },
    [deleteCustomer]
  );

  return (
    <div className="customer-list-page">
      <div className="page-header">
        <h1>顧客マスタ</h1>
        {canEdit && (
          <button
            type="button"
            className="btn-primary"
            onClick={handleOpenCreate}
          >
            新規登録
          </button>
        )}
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button type="button" onClick={clearError} aria-label="閉じる">
            &times;
          </button>
        </div>
      )}

      <CustomerSearchForm onSearch={handleSearch} isLoading={isLoading} />

      {isLoading && customers.length === 0 && (
        <div className="loading">読み込み中...</div>
      )}

      {!isLoading && customers.length === 0 && (
        <div className="empty-state">
          <p>顧客データがありません</p>
        </div>
      )}

      {customers.length > 0 && (
        <>
          <div className="table-container">
            <table className="customer-table">
              <thead>
                <tr>
                  <th>顧客名</th>
                  <th>住所</th>
                  <th>電話番号</th>
                  <th>業種</th>
                  <th>状態</th>
                  {canEdit && <th>操作</th>}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.id}
                    className={customer.isActive ? '' : 'inactive'}
                  >
                    <td>{customer.name}</td>
                    <td>{customer.address ?? '-'}</td>
                    <td>{customer.phone ?? '-'}</td>
                    <td>{customer.industry ?? '-'}</td>
                    <td>
                      <span
                        className={`status-badge ${customer.isActive ? 'active' : 'inactive'}`}
                      >
                        {customer.isActive ? '有効' : '無効'}
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn-sm btn-secondary"
                            onClick={() => handleOpenEdit(customer)}
                          >
                            編集
                          </button>
                          {customer.isActive && (
                            <button
                              type="button"
                              className="btn-sm btn-danger"
                              onClick={() => void handleDelete(customer)}
                            >
                              無効化
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      <CustomerDialog
        isOpen={isDialogOpen}
        customer={selectedCustomer}
        onClose={handleCloseDialog}
        onSave={handleSave}
        isLoading={isSaving}
      />
    </div>
  );
}

/**
 * 顧客登録/編集ダイアログコンポーネント
 */

import { useState, useEffect, useCallback } from 'react';
import type { FormEvent, ChangeEvent } from 'react';

import type {
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '@/schemas/api';
import { createCustomerRequestSchema } from '@/schemas/api';
import type { Customer } from '@/schemas/data';

type CustomerDialogProps = {
  isOpen: boolean;
  customer?: Customer | null;
  onClose: () => void;
  onSave: (
    data: CreateCustomerRequest | UpdateCustomerRequest
  ) => Promise<void>;
  isLoading?: boolean;
};

type FormData = {
  name: string;
  address: string;
  phone: string;
  industry: string;
  isActive: boolean;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

const INDUSTRIES = [
  '製造業',
  'IT・通信',
  '小売・流通',
  '金融・保険',
  '不動産',
  '建設',
  'サービス',
  'その他',
];

const initialFormData: FormData = {
  name: '',
  address: '',
  phone: '',
  industry: '',
  isActive: true,
};

export function CustomerDialog({
  isOpen,
  customer,
  onClose,
  onSave,
  isLoading = false,
}: CustomerDialogProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const isEdit = Boolean(customer);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        address: customer.address ?? '',
        phone: customer.phone ?? '',
        industry: customer.industry ?? '',
        isActive: customer.isActive,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [customer, isOpen]);

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {};

    // Zodスキーマでバリデーション
    const result = createCustomerRequestSchema.safeParse({
      name: formData.name,
      address: formData.address || null,
      phone: formData.phone || null,
      industry: formData.industry || null,
    });

    if (!result.success) {
      result.error.errors.forEach((error) => {
        const field = error.path[0] as keyof FormData;
        if (field) {
          newErrors[field] = error.message;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      const data: CreateCustomerRequest | UpdateCustomerRequest = {
        name: formData.name,
        address: formData.address || null,
        phone: formData.phone || null,
        industry: formData.industry || null,
      };

      if (isEdit) {
        (data as UpdateCustomerRequest).is_active = formData.isActive;
      }

      await onSave(data);
    },
    [formData, isEdit, validateForm, onSave]
  );

  const handleChange = useCallback(
    (field: keyof FormData) =>
      (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const value =
          e.target.type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : e.target.value;
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      },
    []
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{isEdit ? '顧客編集' : '顧客登録'}</h2>
          <button
            type="button"
            className="dialog-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="dialog-body">
            <div className="form-field">
              <label htmlFor="customer-name">
                顧客名 <span className="required">*</span>
              </label>
              <input
                id="customer-name"
                type="text"
                value={formData.name}
                onChange={handleChange('name')}
                disabled={isLoading}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && (
                <span className="error-message">{errors.name}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="customer-address">住所</label>
              <input
                id="customer-address"
                type="text"
                value={formData.address}
                onChange={handleChange('address')}
                disabled={isLoading}
                className={errors.address ? 'error' : ''}
              />
              {errors.address && (
                <span className="error-message">{errors.address}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="customer-phone">電話番号</label>
              <input
                id="customer-phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange('phone')}
                disabled={isLoading}
                placeholder="03-1234-5678"
                className={errors.phone ? 'error' : ''}
              />
              {errors.phone && (
                <span className="error-message">{errors.phone}</span>
              )}
            </div>

            <div className="form-field">
              <label htmlFor="customer-industry">業種</label>
              <select
                id="customer-industry"
                value={formData.industry}
                onChange={handleChange('industry')}
                disabled={isLoading}
              >
                <option value="">選択してください</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {isEdit && (
              <div className="form-field checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={handleChange('isActive')}
                    disabled={isLoading}
                  />
                  有効
                </label>
              </div>
            )}
          </div>

          <div className="dialog-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

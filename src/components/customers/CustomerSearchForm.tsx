/**
 * 顧客検索フォームコンポーネント
 */

import { useState, useCallback } from 'react';
import type { FormEvent, ChangeEvent } from 'react';

import type { CustomerSearchQuery } from '@/schemas/api';

type CustomerSearchFormProps = {
  onSearch: (query: Partial<CustomerSearchQuery>) => void;
  isLoading?: boolean;
};

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

export function CustomerSearchForm({
  onSearch,
  isLoading = false,
}: CustomerSearchFormProps) {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [isActive, setIsActive] = useState<string>('');

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      const query: Partial<CustomerSearchQuery> = {};

      if (name.trim()) {
        query.name = name.trim();
      }
      if (industry) {
        query.industry = industry;
      }
      if (isActive !== '') {
        query.is_active = isActive === 'true';
      }

      onSearch(query);
    },
    [name, industry, isActive, onSearch]
  );

  const handleClear = useCallback(() => {
    setName('');
    setIndustry('');
    setIsActive('');
    onSearch({});
  }, [onSearch]);

  return (
    <form onSubmit={handleSubmit} className="customer-search-form">
      <div className="search-fields">
        <div className="search-field">
          <label htmlFor="search-name">顧客名</label>
          <input
            id="search-name"
            type="text"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
            placeholder="顧客名で検索"
            disabled={isLoading}
          />
        </div>

        <div className="search-field">
          <label htmlFor="search-industry">業種</label>
          <select
            id="search-industry"
            value={industry}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setIndustry(e.target.value)
            }
            disabled={isLoading}
          >
            <option value="">すべて</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>
                {ind}
              </option>
            ))}
          </select>
        </div>

        <div className="search-field">
          <label htmlFor="search-status">状態</label>
          <select
            id="search-status"
            value={isActive}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              setIsActive(e.target.value)
            }
            disabled={isLoading}
          >
            <option value="">すべて</option>
            <option value="true">有効</option>
            <option value="false">無効</option>
          </select>
        </div>
      </div>

      <div className="search-actions">
        <button type="submit" className="btn-primary" disabled={isLoading}>
          検索
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleClear}
          disabled={isLoading}
        >
          クリア
        </button>
      </div>
    </form>
  );
}

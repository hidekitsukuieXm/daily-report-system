/**
 * セレクトボックスコンポーネント
 */

import { forwardRef, type SelectHTMLAttributes } from 'react';

import './Select.css';

export type SelectOption = {
  /** 値 */
  value: string | number;
  /** 表示ラベル */
  label: string;
  /** 無効化 */
  disabled?: boolean;
};

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> & {
  /** オプション一覧 */
  options: SelectOption[];
  /** プレースホルダー */
  placeholder?: string;
  /** エラー状態 */
  error?: boolean;
  /** エラーメッセージ */
  errorMessage?: string;
  /** サイズ */
  size?: 'small' | 'medium' | 'large';
  /** フルワイド表示 */
  fullWidth?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      placeholder,
      error = false,
      errorMessage,
      size = 'medium',
      fullWidth = false,
      className = '',
      id,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const errorId = errorMessage && id ? `${id}-error` : undefined;
    const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div className={`select-wrapper ${fullWidth ? 'select-wrapper--full-width' : ''}`}>
        <select
          ref={ref}
          id={id}
          className={`select select--${size} ${error ? 'select--error' : ''} ${className}`}
          aria-invalid={error}
          aria-describedby={describedBy}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <span className="select-arrow" aria-hidden="true">
          ▼
        </span>
        {errorMessage && (
          <p id={errorId} className="select-error-message" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

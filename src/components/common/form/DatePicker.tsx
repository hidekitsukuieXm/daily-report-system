/**
 * 日付選択コンポーネント
 */

import { forwardRef, type InputHTMLAttributes } from 'react';

import './DatePicker.css';

export type DatePickerProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> & {
  /** エラー状態 */
  error?: boolean;
  /** エラーメッセージ */
  errorMessage?: string;
  /** サイズ */
  size?: 'small' | 'medium' | 'large';
  /** フルワイド表示 */
  fullWidth?: boolean;
};

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
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
      <div
        className={`date-picker-wrapper ${fullWidth ? 'date-picker-wrapper--full-width' : ''}`}
      >
        <input
          ref={ref}
          type="date"
          id={id}
          className={`date-picker date-picker--${size} ${error ? 'date-picker--error' : ''} ${className}`}
          aria-invalid={error}
          aria-describedby={describedBy}
          {...props}
        />
        {errorMessage && (
          <p id={errorId} className="date-picker-error-message" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

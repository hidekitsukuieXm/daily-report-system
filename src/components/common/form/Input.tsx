/**
 * テキスト入力コンポーネント
 */

import { forwardRef, type InputHTMLAttributes } from 'react';

import './Input.css';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  /** エラー状態 */
  error?: boolean;
  /** エラーメッセージ */
  errorMessage?: string;
  /** サイズ */
  size?: 'small' | 'medium' | 'large';
  /** フルワイド表示 */
  fullWidth?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
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
      <div className={`input-wrapper ${fullWidth ? 'input-wrapper--full-width' : ''}`}>
        <input
          ref={ref}
          id={id}
          className={`input input--${size} ${error ? 'input--error' : ''} ${className}`}
          aria-invalid={error}
          aria-describedby={describedBy}
          {...props}
        />
        {errorMessage && (
          <p id={errorId} className="input-error-message" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

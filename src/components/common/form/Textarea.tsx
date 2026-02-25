/**
 * テキストエリアコンポーネント
 */

import { forwardRef, type TextareaHTMLAttributes } from 'react';

import './Textarea.css';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** エラー状態 */
  error?: boolean;
  /** エラーメッセージ */
  errorMessage?: string;
  /** サイズ */
  size?: 'small' | 'medium' | 'large';
  /** フルワイド表示 */
  fullWidth?: boolean;
  /** リサイズ設定 */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      error = false,
      errorMessage,
      size = 'medium',
      fullWidth = false,
      resize = 'vertical',
      className = '',
      id,
      rows = 4,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref
  ) => {
    const errorId = errorMessage && id ? `${id}-error` : undefined;
    const describedBy = [ariaDescribedBy, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <div
        className={`textarea-wrapper ${fullWidth ? 'textarea-wrapper--full-width' : ''}`}
      >
        <textarea
          ref={ref}
          id={id}
          rows={rows}
          className={`textarea textarea--${size} textarea--resize-${resize} ${error ? 'textarea--error' : ''} ${className}`}
          aria-invalid={error}
          aria-describedby={describedBy}
          {...props}
        />
        {errorMessage && (
          <p id={errorId} className="textarea-error-message" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

/**
 * ボタンコンポーネント
 */

import { forwardRef, type ButtonHTMLAttributes } from 'react';

import './Button.css';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** バリアント */
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  /** サイズ */
  size?: 'small' | 'medium' | 'large';
  /** フルワイド表示 */
  fullWidth?: boolean;
  /** ローディング状態 */
  loading?: boolean;
  /** アイコン（左） */
  startIcon?: React.ReactNode;
  /** アイコン（右） */
  endIcon?: React.ReactNode;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      loading = false,
      startIcon,
      endIcon,
      disabled,
      className = '',
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled ?? loading;

    return (
      <button
        ref={ref}
        type={type}
        className={`button button--${variant} button--${size} ${fullWidth ? 'button--full-width' : ''} ${loading ? 'button--loading' : ''} ${className}`}
        disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span className="button-spinner" aria-hidden="true">
            <span className="button-spinner-inner" />
          </span>
        )}
        {startIcon && !loading && (
          <span className="button-icon button-icon--start">{startIcon}</span>
        )}
        <span className="button-label">{children}</span>
        {endIcon && !loading && (
          <span className="button-icon button-icon--end">{endIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

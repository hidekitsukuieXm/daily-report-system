/**
 * トーストコンポーネント
 */

import { useEffect, useCallback } from 'react';

import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastProps = {
  /** 表示状態 */
  open: boolean;
  /** メッセージ */
  message: string;
  /** トーストタイプ */
  type?: ToastType;
  /** 自動非表示までの時間（ms） */
  duration?: number;
  /** 閉じるハンドラー */
  onClose: () => void;
  /** 位置 */
  position?: 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};

export function Toast({
  open,
  message,
  type = 'info',
  duration = 5000,
  onClose,
  position = 'bottom',
}: ToastProps) {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (open && duration > 0) {
      const timer = setTimeout(handleClose, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, handleClose]);

  if (!open) {
    return null;
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '!';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'i';
    }
  };

  return (
    <div
      className={`toast toast--${type} toast--${position}`}
      role="alert"
      aria-live="polite"
    >
      <span className="toast-icon" aria-hidden="true">
        {getIcon()}
      </span>
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={handleClose}
        aria-label="閉じる"
      >
        ×
      </button>
    </div>
  );
}

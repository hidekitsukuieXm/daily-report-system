/**
 * エラーメッセージコンポーネント
 */

import './ErrorMessage.css';

export type ErrorMessageProps = {
  /** タイトル */
  title?: string;
  /** メッセージ */
  message: string;
  /** 再試行ボタンのハンドラー */
  onRetry?: () => void;
  /** 再試行ボタンのテキスト */
  retryText?: string;
  /** バリアント */
  variant?: 'error' | 'warning' | 'info';
};

export function ErrorMessage({
  title,
  message,
  onRetry,
  retryText = '再試行',
  variant = 'error',
}: ErrorMessageProps) {
  return (
    <div
      className={`error-message error-message--${variant}`}
      role="alert"
      aria-live="assertive"
    >
      <div className="error-message-icon" aria-hidden="true">
        {variant === 'error' && '!'}
        {variant === 'warning' && '⚠'}
        {variant === 'info' && 'i'}
      </div>
      <div className="error-message-content">
        {title && <p className="error-message-title">{title}</p>}
        <p className="error-message-text">{message}</p>
        {onRetry && (
          <button
            type="button"
            className="error-message-retry"
            onClick={onRetry}
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
}

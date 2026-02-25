/**
 * ローディングコンポーネント
 */

import './Loading.css';

export type LoadingProps = {
  /** サイズ */
  size?: 'small' | 'medium' | 'large';
  /** ローディングテキスト */
  text?: string;
  /** フルスクリーン表示 */
  fullScreen?: boolean;
  /** オーバーレイ表示 */
  overlay?: boolean;
};

export function Loading({
  size = 'medium',
  text,
  fullScreen = false,
  overlay = false,
}: LoadingProps) {
  const content = (
    <div
      className={`loading loading--${size}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span className="loading-spinner" aria-hidden="true" />
      {text && <span className="loading-text">{text}</span>}
      <span className="sr-only">読み込み中</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        {content}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="loading-overlay">
        {content}
      </div>
    );
  }

  return content;
}

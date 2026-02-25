/**
 * カードコンポーネント
 */

import type { ReactNode } from 'react';

import './Card.css';

export type CardProps = {
  /** タイトル */
  title?: string;
  /** サブタイトル */
  subtitle?: string;
  /** ヘッダーアクション */
  headerAction?: ReactNode;
  /** 子要素（カード本文） */
  children: ReactNode;
  /** フッター */
  footer?: ReactNode;
  /** パディングなし */
  noPadding?: boolean;
  /** 影の深さ */
  elevation?: 'none' | 'low' | 'medium' | 'high';
  /** クリック可能 */
  clickable?: boolean;
  /** クリックハンドラー */
  onClick?: () => void;
};

export function Card({
  title,
  subtitle,
  headerAction,
  children,
  footer,
  noPadding = false,
  elevation = 'low',
  clickable = false,
  onClick,
}: CardProps) {
  const hasHeader = Boolean(title ?? subtitle ?? headerAction);

  const cardClassName = [
    'card',
    `card--elevation-${elevation}`,
    clickable && 'card--clickable',
  ]
    .filter(Boolean)
    .join(' ');

  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (clickable && onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className={cardClassName}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={clickable ? 0 : undefined}
      role={clickable ? 'button' : undefined}
    >
      {hasHeader && (
        <div className="card-header">
          <div className="card-header-content">
            {title && <h3 className="card-title">{title}</h3>}
            {subtitle && <p className="card-subtitle">{subtitle}</p>}
          </div>
          {headerAction && (
            <div className="card-header-action">{headerAction}</div>
          )}
        </div>
      )}

      <div className={`card-body ${noPadding ? 'card-body--no-padding' : ''}`}>
        {children}
      </div>

      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}

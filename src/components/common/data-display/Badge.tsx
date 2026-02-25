/**
 * バッジコンポーネント
 */

import type { ReactNode } from 'react';

import './Badge.css';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type BadgeProps = {
  /** 表示内容 */
  children: ReactNode;
  /** バリアント */
  variant?: BadgeVariant;
  /** サイズ */
  size?: 'small' | 'medium' | 'large';
  /** アウトラインスタイル */
  outline?: boolean;
  /** 丸み */
  rounded?: boolean;
};

export function Badge({
  children,
  variant = 'default',
  size = 'medium',
  outline = false,
  rounded = false,
}: BadgeProps) {
  const className = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    outline && 'badge--outline',
    rounded && 'badge--rounded',
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={className}>{children}</span>;
}

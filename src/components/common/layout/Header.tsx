/**
 * ヘッダーコンポーネント
 */

import { NavLink } from 'react-router-dom';

import './Header.css';

export type HeaderProps = {
  /** システムタイトル */
  title?: string;
  /** ユーザー名 */
  userName?: string;
  /** 役職名 */
  positionName?: string;
  /** ログアウトハンドラー */
  onLogout?: () => void;
};

export function Header({
  title = '営業日報システム',
  userName,
  positionName,
  onLogout,
}: HeaderProps) {
  return (
    <header className="header" role="banner">
      <div className="header-left">
        <NavLink to="/dashboard" className="header-logo" aria-label="ダッシュボードへ">
          {title}
        </NavLink>
      </div>
      <div className="header-right">
        {userName && (
          <div className="user-info" aria-label="ユーザー情報">
            <span className="user-name">{userName}</span>
            {positionName && (
              <span className="user-position">{positionName}</span>
            )}
          </div>
        )}
        {onLogout && (
          <button
            type="button"
            className="logout-button"
            onClick={onLogout}
            aria-label="ログアウト"
          >
            ログアウト
          </button>
        )}
      </div>
    </header>
  );
}

/**
 * サイドバーコンポーネント
 */

import { NavLink } from 'react-router-dom';

import './Sidebar.css';

export type SidebarItem = {
  /** パス */
  path: string;
  /** ラベル */
  label: string;
  /** アイコン（オプション） */
  icon?: React.ReactNode;
  /** 表示条件（オプション） */
  visible?: boolean;
};

export type SidebarProps = {
  /** ナビゲーション項目 */
  items: SidebarItem[];
  /** 折りたたみ状態 */
  collapsed?: boolean;
  /** 折りたたみ切り替えハンドラー */
  onToggleCollapse?: () => void;
};

export function Sidebar({ items, collapsed = false, onToggleCollapse }: SidebarProps) {
  const visibleItems = items.filter((item) => item.visible !== false);

  return (
    <aside
      className={`sidebar ${collapsed ? 'sidebar--collapsed' : ''}`}
      role="navigation"
      aria-label="メインナビゲーション"
    >
      {onToggleCollapse && (
        <button
          type="button"
          className="sidebar-toggle"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
          aria-expanded={!collapsed}
        >
          <span className="sidebar-toggle-icon">{collapsed ? '→' : '←'}</span>
        </button>
      )}
      <nav className="sidebar-nav">
        <ul className="sidebar-menu" role="menubar">
          {visibleItems.map((item) => (
            <li key={item.path} className="sidebar-menu-item" role="none">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`
                }
                role="menuitem"
              >
                {item.icon && <span className="sidebar-link-icon">{item.icon}</span>}
                {!collapsed && <span className="sidebar-link-label">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

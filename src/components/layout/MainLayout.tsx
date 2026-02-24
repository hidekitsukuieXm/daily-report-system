/**
 * メインレイアウト
 */

import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/stores/auth';

import './MainLayout.css';

export function MainLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    void navigate('/login', { replace: true });
  };

  const positionLevel = user?.position.level ?? 1;
  const isManager = positionLevel >= 2;

  return (
    <div className="main-layout">
      <header className="main-header">
        <div className="header-left">
          <NavLink to="/dashboard" className="header-logo">
            営業日報システム
          </NavLink>
        </div>
        <div className="header-right">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="user-position">{user?.position.name}</span>
          </div>
          <button
            type="button"
            className="logout-button"
            onClick={() => void handleLogout()}
          >
            ログアウト
          </button>
        </div>
      </header>

      <div className="main-content">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              ダッシュボード
            </NavLink>
            <NavLink
              to="/reports"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              日報一覧
            </NavLink>
            {!isManager && (
              <NavLink
                to="/reports/new"
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                日報作成
              </NavLink>
            )}
            {isManager && (
              <NavLink
                to="/approvals"
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                承認待ち
              </NavLink>
            )}
            <NavLink
              to="/customers"
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
            >
              顧客マスタ
            </NavLink>
            {isManager && (
              <NavLink
                to="/salespersons"
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                営業担当者マスタ
              </NavLink>
            )}
          </nav>
        </aside>

        <main className="main-area">
          <Outlet />
        </main>
      </div>

      <footer className="main-footer">
        <p>&copy; 2024 営業日報システム</p>
      </footer>
    </div>
  );
}

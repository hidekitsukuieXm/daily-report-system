/**
 * ダッシュボード画面
 * SCR-002（認証機能の一部として仮実装）
 */

import { useAuthStore } from '@/stores/auth';

import './DashboardPage.css';

export function DashboardPage() {
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1 className="dashboard-title">営業日報システム</h1>
        <div className="user-info">
          <span className="user-name">{user?.name}</span>
          <span className="user-position">{user?.position.name}</span>
          <button className="logout-button" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>ようこそ、{user?.name}さん</h2>
          <p>営業日報システムへのログインに成功しました。</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>今月の活動</h3>
            <div className="card-content">
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">訪問件数</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">0</span>
                <span className="stat-label">日報作成数</span>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <h3>直近の日報</h3>
            <div className="card-content">
              <p className="empty-message">日報はありません</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

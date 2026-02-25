/**
 * アプリケーションレイアウトコンポーネント
 */

import { useState, useCallback } from 'react';

import { Footer, type FooterProps } from './Footer';
import { Header, type HeaderProps } from './Header';
import { Sidebar, type SidebarItem } from './Sidebar';
import './AppLayout.css';

export type AppLayoutProps = {
  /** ヘッダーのプロパティ */
  headerProps?: Omit<HeaderProps, 'onMenuToggle'>;
  /** サイドバーのナビゲーション項目 */
  sidebarItems?: SidebarItem[];
  /** フッターのプロパティ */
  footerProps?: FooterProps;
  /** サイドバーを表示するか */
  showSidebar?: boolean;
  /** 子要素 */
  children: React.ReactNode;
};

export function AppLayout({
  headerProps,
  sidebarItems = [],
  footerProps,
  showSidebar = true,
  children,
}: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleToggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleMobileMenuToggle = useCallback(() => {
    setMobileSidebarOpen((prev) => !prev);
  }, []);

  const handleCloseMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  const getMainClassName = (): string => {
    const hasSidebar = showSidebar && sidebarItems.length > 0;
    if (!hasSidebar) {
      return 'app-layout-main';
    }
    if (sidebarCollapsed) {
      return 'app-layout-main app-layout-main--sidebar-collapsed';
    }
    return 'app-layout-main app-layout-main--with-sidebar';
  };

  return (
    <div className="app-layout">
      <Header {...headerProps} />

      <div className="app-layout-body">
        {showSidebar && sidebarItems.length > 0 && (
          <>
            <Sidebar
              items={sidebarItems}
              collapsed={sidebarCollapsed}
              onToggleCollapse={handleToggleSidebar}
            />
            {/* モバイル用オーバーレイ */}
            {mobileSidebarOpen && (
              <div
                className="app-layout-overlay"
                onClick={handleCloseMobileSidebar}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    handleCloseMobileSidebar();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="サイドバーを閉じる"
              />
            )}
          </>
        )}

        <main
          className={getMainClassName()}
          role="main"
          aria-label="メインコンテンツ"
        >
          <div className="app-layout-content">{children}</div>
          <Footer {...footerProps} />
        </main>
      </div>

      {/* モバイル用メニューボタン */}
      {showSidebar && sidebarItems.length > 0 && (
        <button
          type="button"
          className="app-layout-mobile-menu-button"
          onClick={handleMobileMenuToggle}
          aria-label={mobileSidebarOpen ? 'メニューを閉じる' : 'メニューを開く'}
          aria-expanded={mobileSidebarOpen}
        >
          <span className="app-layout-mobile-menu-icon">
            {mobileSidebarOpen ? '×' : '☰'}
          </span>
        </button>
      )}
    </div>
  );
}

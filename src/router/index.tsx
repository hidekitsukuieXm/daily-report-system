/**
 * ルーター設定
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthGuard, GuestGuard } from '@/components/auth';
import { MainLayout } from '@/components/layout';
import {
  LoginPage,
  DashboardPage,
  ReportListPage,
  ReportFormPage,
  ReportDetailPage,
  ApprovalListPage,
} from '@/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: (
      <GuestGuard>
        <LoginPage />
      </GuestGuard>
    ),
  },
  {
    // 認証が必要なルート（メインレイアウト付き）
    element: (
      <AuthGuard>
        <MainLayout />
      </AuthGuard>
    ),
    children: [
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      {
        path: '/reports',
        element: <ReportListPage />,
      },
      {
        path: '/reports/new',
        element: <ReportFormPage />,
      },
      {
        path: '/reports/:id',
        element: <ReportDetailPage />,
      },
      {
        path: '/reports/:id/edit',
        element: <ReportFormPage />,
      },
      {
        path: '/approvals',
        element: <ApprovalListPage />,
      },
    ],
  },
  {
    path: '*',
    element: (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>404 - ページが見つかりません</h1>
        <p>お探しのページは存在しません。</p>
      </div>
    ),
  },
]);

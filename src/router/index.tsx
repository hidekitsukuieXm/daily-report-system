/**
 * ルーター設定
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthGuard, GuestGuard, PositionLevel } from '@/components/auth';
import { MainLayout } from '@/components/layout';
import {
  LoginPage,
  DashboardPage,
  ApprovalsPage,
  ReportListPage,
  ReportFormPage,
  ReportDetailPage,
  CustomerListPage,
  CustomerFormPage,
  SalespersonListPage,
  SalespersonFormPage,
  NotFoundPage,
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
      // ダッシュボード
      {
        path: '/dashboard',
        element: <DashboardPage />,
      },
      // 日報管理
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
      // 承認待ち（課長・部長のみ）
      {
        path: '/approvals',
        element: (
          <AuthGuard requiredLevel={PositionLevel.MANAGER}>
            <ApprovalsPage />
          </AuthGuard>
        ),
      },
      // 顧客マスタ
      {
        path: '/customers',
        element: <CustomerListPage />,
      },
      {
        path: '/customers/new',
        element: (
          <AuthGuard requiredLevel={PositionLevel.MANAGER}>
            <CustomerFormPage />
          </AuthGuard>
        ),
      },
      {
        path: '/customers/:id',
        element: (
          <AuthGuard requiredLevel={PositionLevel.MANAGER}>
            <CustomerFormPage />
          </AuthGuard>
        ),
      },
      // 営業担当者マスタ（課長・部長のみ）
      {
        path: '/salespersons',
        element: (
          <AuthGuard requiredLevel={PositionLevel.MANAGER}>
            <SalespersonListPage />
          </AuthGuard>
        ),
      },
      {
        path: '/salespersons/new',
        element: (
          <AuthGuard requiredLevel={PositionLevel.DIRECTOR}>
            <SalespersonFormPage />
          </AuthGuard>
        ),
      },
      {
        path: '/salespersons/:id',
        element: (
          <AuthGuard requiredLevel={PositionLevel.DIRECTOR}>
            <SalespersonFormPage />
          </AuthGuard>
        ),
      },
    ],
  },
  // 404ページ
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

/**
 * ルーター設定
 */

import { createBrowserRouter, Navigate } from 'react-router-dom';

import { AuthGuard, GuestGuard } from '@/components/auth';
import { LoginPage, DashboardPage, CustomerFormPage } from '@/pages';

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
    path: '/dashboard',
    element: (
      <AuthGuard>
        <DashboardPage />
      </AuthGuard>
    ),
  },
  {
    path: '/customers/new',
    element: (
      <AuthGuard>
        <CustomerFormPage />
      </AuthGuard>
    ),
  },
  {
    path: '/customers/:id/edit',
    element: (
      <AuthGuard>
        <CustomerFormPage />
      </AuthGuard>
    ),
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

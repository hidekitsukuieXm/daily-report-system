/**
 * 認証ガードコンポーネントのテスト
 */

import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAuthStore } from '@/stores/auth';

import { AuthGuard, GuestGuard, RoleGuard, PositionLevel } from './AuthGuard';

// useAuthStoreをモック
vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(),
}));

type MockAuthState = {
  isAuthenticated: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    position: { id: number; name: string; level: number };
  } | null;
  checkAuth: () => Promise<void>;
};

const mockUseAuthStore = vi.mocked(useAuthStore);

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('認証チェック中はローディングを表示する', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      checkAuth: vi.fn(() => new Promise(() => {})),
    } as MockAuthState);

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('認証を確認中...')).toBeInTheDocument();
  });

  it('未認証の場合はログイン画面にリダイレクトする', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      checkAuth: vi.fn(() => Promise.resolve()),
    } as MockAuthState);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/protected"
            element={
              <AuthGuard>
                <div>Protected Content</div>
              </AuthGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText('Login Page');
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('認証済みの場合は子コンポーネントを表示する', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        position: { id: 1, name: '担当', level: 1 },
      },
      checkAuth: vi.fn(() => Promise.resolve()),
    } as MockAuthState);

    render(
      <MemoryRouter>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await screen.findByText('Protected Content');
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('役職レベルが不足している場合はアクセス権限エラーを表示する', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        position: { id: 1, name: '担当', level: 1 },
      },
      checkAuth: vi.fn(() => Promise.resolve()),
    } as MockAuthState);

    render(
      <MemoryRouter>
        <AuthGuard requiredLevel={PositionLevel.MANAGER}>
          <div>Manager Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await screen.findByText('アクセス権限がありません');
    expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument();
  });

  it('役職レベルが十分な場合は子コンポーネントを表示する', async () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        position: { id: 2, name: '課長', level: 2 },
      },
      checkAuth: vi.fn(() => Promise.resolve()),
    } as MockAuthState);

    render(
      <MemoryRouter>
        <AuthGuard requiredLevel={PositionLevel.MANAGER}>
          <div>Manager Content</div>
        </AuthGuard>
      </MemoryRouter>
    );

    await screen.findByText('Manager Content');
    expect(screen.getByText('Manager Content')).toBeInTheDocument();
  });
});

describe('GuestGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('未認証の場合は子コンポーネントを表示する', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      checkAuth: vi.fn(),
    } as MockAuthState);

    render(
      <MemoryRouter>
        <GuestGuard>
          <div>Login Form</div>
        </GuestGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Form')).toBeInTheDocument();
  });

  it('認証済みの場合はダッシュボードにリダイレクトする', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        position: { id: 1, name: '担当', level: 1 },
      },
      checkAuth: vi.fn(),
    } as MockAuthState);

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route
            path="/login"
            element={
              <GuestGuard>
                <div>Login Form</div>
              </GuestGuard>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ユーザーがnullの場合はnullを返す', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      user: null,
      checkAuth: vi.fn(),
    } as MockAuthState);

    const { container } = render(
      <MemoryRouter>
        <RoleGuard requiredLevel={PositionLevel.MANAGER}>
          <div>Protected Content</div>
        </RoleGuard>
      </MemoryRouter>
    );

    expect(container.firstChild).toBeNull();
  });

  it('役職レベルが不足している場合はデフォルトのエラーを表示する', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        position: { id: 1, name: '担当', level: 1 },
      },
      checkAuth: vi.fn(),
    } as MockAuthState);

    render(
      <MemoryRouter>
        <RoleGuard requiredLevel={PositionLevel.MANAGER}>
          <div>Manager Content</div>
        </RoleGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('アクセス権限がありません')).toBeInTheDocument();
  });

  it('役職レベルが十分な場合は子コンポーネントを表示する', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      user: {
        id: 1,
        name: 'テストユーザー',
        email: 'test@example.com',
        position: { id: 3, name: '部長', level: 3 },
      },
      checkAuth: vi.fn(),
    } as MockAuthState);

    render(
      <MemoryRouter>
        <RoleGuard requiredLevel={PositionLevel.DIRECTOR}>
          <div>Director Content</div>
        </RoleGuard>
      </MemoryRouter>
    );

    expect(screen.getByText('Director Content')).toBeInTheDocument();
  });
});

describe('PositionLevel', () => {
  it('正しいレベル値を持っている', () => {
    expect(PositionLevel.STAFF).toBe(1);
    expect(PositionLevel.MANAGER).toBe(2);
    expect(PositionLevel.DIRECTOR).toBe(3);
  });
});

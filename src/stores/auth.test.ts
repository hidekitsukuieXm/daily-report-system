/**
 * 認証ストアのテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuthStore } from './auth';

// APIモジュールをモック
vi.mock('@/lib/api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  refreshToken: vi.fn(),
  getCurrentUser: vi.fn(),
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // ストアをリセット
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });

    // モックをリセット
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();

      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('login', () => {
    it('should set loading state during login', async () => {
      const { login } = await import('@/lib/api/auth');
      const mockLogin = vi.mocked(login);

      mockLogin.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true as const,
                  data: {
                    access_token: 'test-token',
                    refresh_token: 'test-refresh',
                    token_type: 'Bearer' as const,
                    expires_in: 3600,
                    user: {
                      id: 1,
                      name: 'Test User',
                      email: 'test@example.com',
                      position: { id: 1, name: '担当', level: 1 },
                    },
                  },
                }),
              100
            )
          )
      );

      const loginPromise = useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password',
        remember: false,
      });

      expect(useAuthStore.getState().isLoading).toBe(true);

      await loginPromise;

      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set user and tokens on successful login', async () => {
      const { login } = await import('@/lib/api/auth');
      const mockLogin = vi.mocked(login);

      const mockUser = {
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        position: { id: 1, name: '担当', level: 1 },
      };

      mockLogin.mockResolvedValue({
        success: true,
        data: {
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          token_type: 'Bearer',
          expires_in: 3600,
          user: mockUser,
        },
      });

      await useAuthStore.getState().login({
        email: 'test@example.com',
        password: 'password',
        remember: false,
      });

      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('test-token');
      expect(state.refreshToken).toBe('test-refresh');
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set error on failed login', async () => {
      const { login } = await import('@/lib/api/auth');
      const mockLogin = vi.mocked(login);

      mockLogin.mockRejectedValue(new Error('Invalid credentials'));

      await expect(
        useAuthStore.getState().login({
          email: 'test@example.com',
          password: 'wrong',
          remember: false,
        })
      ).rejects.toThrow();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should clear state on logout', async () => {
      const { logout } = await import('@/lib/api/auth');
      const mockLogout = vi.mocked(logout);

      mockLogout.mockResolvedValue({
        success: true,
        data: { message: 'Logged out' },
      });

      // Set initial authenticated state
      useAuthStore.setState({
        user: {
          id: 1,
          name: 'Test',
          email: 'test@example.com',
          position: { id: 1, name: '担当', level: 1 },
        },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should clear state even if logout API fails', async () => {
      const { logout } = await import('@/lib/api/auth');
      const mockLogout = vi.mocked(logout);

      mockLogout.mockRejectedValue(new Error('Network error'));

      useAuthStore.setState({
        user: {
          id: 1,
          name: 'Test',
          email: 'test@example.com',
          position: { id: 1, name: '担当', level: 1 },
        },
        accessToken: 'token',
        refreshToken: 'refresh',
        isAuthenticated: true,
      });

      await useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('setUser', () => {
    it('should set user', () => {
      const user = {
        id: 1,
        name: 'Test',
        email: 'test@example.com',
        position: { id: 1, name: '担当', level: 1 },
      };

      useAuthStore.getState().setUser(user);

      expect(useAuthStore.getState().user).toEqual(user);
    });
  });

  describe('setTokens', () => {
    it('should set tokens and mark as authenticated', () => {
      useAuthStore.getState().setTokens('access', 'refresh');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('access');
      expect(state.refreshToken).toBe('refresh');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('clearError', () => {
    it('should clear error', () => {
      useAuthStore.setState({ error: 'Some error' });

      useAuthStore.getState().clearError();

      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});

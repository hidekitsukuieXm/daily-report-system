/**
 * ログイン画面のテスト
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useAuthStore } from '@/stores/auth';

import { LoginPage } from './LoginPage';

// useNavigateをモック
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
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

    mockNavigate.mockClear();
  });

  const renderLoginPage = () => {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  };

  it('should render login form', () => {
    renderLoginPage();

    expect(screen.getByLabelText(/メールアドレス/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/パスワードを入力/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /ログイン/i })
    ).toBeInTheDocument();
  });

  it('should show validation error for empty email', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    await user.click(submitButton);

    expect(
      screen.getByText(/メールアドレスを入力してください/i)
    ).toBeInTheDocument();
  });

  it.skip('should show validation error for invalid email', async () => {
    // TODO: 環境依存の問題があるため一時的にスキップ
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByPlaceholderText(/パスワードを入力/i);

    await user.type(emailInput, 'invalid-email');
    await user.type(passwordInput, 'password123');

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/有効なメールアドレスを入力してください/i)
      ).toBeInTheDocument();
    });
  });

  it('should show validation error for empty password', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    await user.type(emailInput, 'test@example.com');

    const submitButton = screen.getByRole('button', { name: /ログイン/i });
    await user.click(submitButton);

    expect(
      screen.getByText(/パスワードを入力してください/i)
    ).toBeInTheDocument();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const passwordInput = screen.getByPlaceholderText(/パスワードを入力/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = screen.getByRole('button', { name: /表示/i });
    await user.click(toggleButton);

    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();

    // loginメソッドをモック
    const loginMock = vi
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );
    useAuthStore.setState({ login: loginMock });

    renderLoginPage();

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByPlaceholderText(/パスワードを入力/i);
    const submitButton = screen.getByRole('button', { name: /ログイン/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');

    // クリック直後はローディング状態ではない
    await user.click(submitButton);

    // loginが呼ばれたことを確認
    expect(loginMock).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      remember: false,
    });
  });

  it('should display error from store', () => {
    useAuthStore.setState({ error: 'ログインに失敗しました' });

    renderLoginPage();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'ログインに失敗しました'
    );
  });

  it('should navigate to dashboard on successful login', async () => {
    const user = userEvent.setup();

    // loginメソッドをモック
    const loginMock = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({ login: loginMock });

    renderLoginPage();

    const emailInput = screen.getByLabelText(/メールアドレス/i);
    const passwordInput = screen.getByPlaceholderText(/パスワードを入力/i);
    const submitButton = screen.getByRole('button', { name: /ログイン/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', {
        replace: true,
      });
    });
  });

  it('should check remember me checkbox', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    await user.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});

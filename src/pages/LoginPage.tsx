/**
 * ログイン画面
 * SCR-001
 */

import { useState } from 'react';
import type { FormEvent } from 'react';

import { useNavigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '@/stores/auth';

import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  // リダイレクト先を取得
  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ??
    '/dashboard';

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '有効なメールアドレスを入力してください';
    }

    if (!password) {
      errors.password = 'パスワードを入力してください';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!validate()) {
      return;
    }

    void login({ email, password, remember }).then(
      () => {
        void navigate(from, { replace: true });
      },
      () => {
        // エラーはストアで管理されるので何もしない
      }
    );
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">営業日報システム</h1>
          <p className="login-subtitle">ログイン</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              className={`form-input ${validationErrors.email ? 'input-error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              autoComplete="email"
              disabled={isLoading}
              aria-invalid={!!validationErrors.email}
              aria-describedby={
                validationErrors.email ? 'email-error' : undefined
              }
            />
            {validationErrors.email && (
              <p id="email-error" className="error-message">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              パスワード
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${validationErrors.password ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワードを入力"
                autoComplete="current-password"
                disabled={isLoading}
                aria-invalid={!!validationErrors.password}
                aria-describedby={
                  validationErrors.password ? 'password-error' : undefined
                }
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? 'パスワードを隠す' : 'パスワードを表示'
                }
              >
                {showPassword ? '隠す' : '表示'}
              </button>
            </div>
            {validationErrors.password && (
              <p id="password-error" className="error-message">
                {validationErrors.password}
              </p>
            )}
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                disabled={isLoading}
              />
              <span>ログイン状態を保持する</span>
            </label>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}

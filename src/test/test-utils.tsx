/**
 * テストユーティリティ
 * カスタムレンダラーとヘルパー関数
 */

import type { ReactElement, ReactNode } from 'react';

import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

/**
 * プロバイダーラッパー
 * 必要に応じてコンテキストプロバイダーを追加
 */
type AllTheProvidersProps = {
  children: ReactNode;
};

function AllTheProviders({ children }: AllTheProvidersProps) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

/**
 * カスタムレンダー関数
 * プロバイダーでラップしたコンポーネントをレンダリング
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * userEvent付きレンダー関数
 * ユーザー操作のシミュレーションも含めたレンダリング
 */
function renderWithUser(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return {
    user: userEvent.setup(),
    ...customRender(ui, options),
  };
}

// re-export everything
export * from '@testing-library/react';
export { customRender as render, renderWithUser, userEvent };

/**
 * テストユーティリティ
 * カスタムレンダラーとヘルパー関数
 */

import type { ReactElement, ReactNode } from 'react';

import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * プロバイダーラッパー
 * 必要に応じてコンテキストプロバイダーを追加
 */
type AllTheProvidersProps = {
  children: ReactNode;
};

function AllTheProviders({ children }: AllTheProvidersProps) {
  return (
    // 将来的にはここにプロバイダーを追加
    // <QueryClientProvider client={queryClient}>
    //   <AuthProvider>
    //     {children}
    //   </AuthProvider>
    // </QueryClientProvider>
    <>{children}</>
  );
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

/**
 * Appコンポーネントのテスト
 */

import { describe, expect, it } from 'vitest';

import App from './App';
import { render, screen } from './test/test-utils';

describe('App', () => {
  it('タイトルが表示される', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      '営業日報システム'
    );
  });
});

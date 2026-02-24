/**
 * APIスキーマのテスト
 */

import { describe, expect, it } from 'vitest';

import {
  loginRequestSchema,
  createReportRequestSchema,
  createCustomerRequestSchema,
  visitRecordInputSchema,
  rejectRequestSchema,
} from './api';

describe('loginRequestSchema', () => {
  it('有効なログインリクエストを受け付ける', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
      remember: true,
    };

    const result = loginRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('不正なメールアドレスを拒否する', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'password123',
    };

    const result = loginRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('空のパスワードを拒否する', () => {
    const invalidData = {
      email: 'test@example.com',
      password: '',
    };

    const result = loginRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('rememberのデフォルト値はfalse', () => {
    const validData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const result = loginRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.remember).toBe(false);
    }
  });
});

describe('createReportRequestSchema', () => {
  it('有効な日報作成リクエストを受け付ける', () => {
    const validData = {
      report_date: '2024-01-15',
      problem: '課題内容',
      plan: '明日の予定',
      visits: [
        {
          customer_id: 1,
          visit_time: '10:00',
          content: '訪問内容',
          result: 'negotiating',
        },
      ],
    };

    const result = createReportRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('不正な日付形式を拒否する', () => {
    const invalidData = {
      report_date: '2024/01/15', // スラッシュ区切りは不正
    };

    const result = createReportRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('訪問記録なしでも受け付ける', () => {
    const validData = {
      report_date: '2024-01-15',
    };

    const result = createReportRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});

describe('visitRecordInputSchema', () => {
  it('有効な訪問記録を受け付ける', () => {
    const validData = {
      customer_id: 1,
      visit_time: '14:30',
      content: '新商品の提案を実施',
      result: 'closed_won',
    };

    const result = visitRecordInputSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('顧客IDがない場合は拒否する', () => {
    const invalidData = {
      content: '訪問内容',
    };

    const result = visitRecordInputSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('訪問内容が空の場合は拒否する', () => {
    const invalidData = {
      customer_id: 1,
      content: '',
    };

    const result = visitRecordInputSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('不正な時刻形式を拒否する', () => {
    const invalidData = {
      customer_id: 1,
      visit_time: '25:00', // 不正な時刻
      content: '訪問内容',
    };

    const result = visitRecordInputSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('不正な結果コードを拒否する', () => {
    const invalidData = {
      customer_id: 1,
      content: '訪問内容',
      result: 'invalid_result',
    };

    const result = visitRecordInputSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('createCustomerRequestSchema', () => {
  it('有効な顧客作成リクエストを受け付ける', () => {
    const validData = {
      name: '株式会社テスト',
      address: '東京都千代田区',
      phone: '03-1234-5678',
      industry: '製造業',
    };

    const result = createCustomerRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('顧客名がない場合は拒否する', () => {
    const invalidData = {
      address: '東京都千代田区',
    };

    const result = createCustomerRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('不正な電話番号形式を拒否する', () => {
    const invalidData = {
      name: '株式会社テスト',
      phone: 'invalid-phone!',
    };

    const result = createCustomerRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

describe('rejectRequestSchema', () => {
  it('有効な差戻しリクエストを受け付ける', () => {
    const validData = {
      comment: '訪問内容をもう少し詳しく記載してください',
    };

    const result = rejectRequestSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('コメントがない場合は拒否する', () => {
    const invalidData = {};

    const result = rejectRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('空のコメントを拒否する', () => {
    const invalidData = {
      comment: '',
    };

    const result = rejectRequestSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});

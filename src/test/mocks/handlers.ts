/**
 * MSW API モックハンドラー
 */

import { http, HttpResponse } from 'msw';

// サンプルデータ
const mockUser = {
  id: 1,
  name: '山田太郎',
  email: 'yamada@example.com',
  position: { id: 1, name: '担当', level: 1 },
};

const mockManagerUser = {
  id: 2,
  name: '鈴木課長',
  email: 'suzuki@example.com',
  position: { id: 2, name: '課長', level: 2 },
};

const mockCustomers = [
  {
    id: 1,
    name: '株式会社ABC',
    address: '東京都千代田区1-1-1',
    phone: '03-1234-5678',
    industry: '製造業',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '株式会社XYZ',
    address: '東京都渋谷区2-2-2',
    phone: '03-2345-6789',
    industry: 'IT・通信',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockReports = [
  {
    id: 1,
    reportDate: '2024-01-15',
    status: 'submitted',
    salesperson: { id: 1, name: '山田太郎' },
    visitCount: 3,
    submittedAt: '2024-01-15T18:00:00Z',
    createdAt: '2024-01-15T17:00:00Z',
    updatedAt: '2024-01-15T18:00:00Z',
  },
  {
    id: 2,
    reportDate: '2024-01-14',
    status: 'approved',
    salesperson: { id: 1, name: '山田太郎' },
    visitCount: 2,
    submittedAt: '2024-01-14T18:00:00Z',
    createdAt: '2024-01-14T17:00:00Z',
    updatedAt: '2024-01-14T19:00:00Z',
  },
  {
    id: 3,
    reportDate: '2024-01-16',
    status: 'draft',
    salesperson: { id: 1, name: '山田太郎' },
    visitCount: 0,
    submittedAt: null,
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-01-16T10:00:00Z',
  },
];

const mockDashboardSummary = {
  visitCount: 15,
  reportCount: 5,
  pendingApprovalCount: 3,
};

export const handlers = [
  // ダッシュボードAPI
  http.get(/\/dashboard\/summary/, () => {
    return HttpResponse.json({
      success: true,
      data: mockDashboardSummary,
    });
  }),

  // 認証API
  http.post(/\/auth\/login/, async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };

    if (
      body.email === 'yamada@example.com' &&
      body.password === 'password123'
    ) {
      return HttpResponse.json({
        success: true,
        data: {
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: mockUser,
        },
      });
    }

    if (
      body.email === 'suzuki@example.com' &&
      body.password === 'password123'
    ) {
      return HttpResponse.json({
        success: true,
        data: {
          access_token: 'mock-manager-access-token',
          refresh_token: 'mock-manager-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: mockManagerUser,
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      },
      { status: 401 }
    );
  }),

  http.post(/\/auth\/logout/, () => {
    return HttpResponse.json({
      success: true,
      data: { message: 'ログアウトしました' },
    });
  }),

  http.get(/\/auth\/me/, ({ request }) => {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: '認証が必要です' },
        },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: mockUser,
    });
  }),

  http.post(/\/auth\/refresh/, async ({ request }) => {
    const body = (await request.json()) as { refresh_token: string };

    if (body.refresh_token === 'mock-refresh-token') {
      return HttpResponse.json({
        success: true,
        data: {
          access_token: 'new-mock-access-token',
          refresh_token: 'new-mock-refresh-token',
          token_type: 'Bearer',
          expires_in: 3600,
          user: mockUser,
        },
      });
    }

    return HttpResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: 'リフレッシュトークンが無効です',
        },
      },
      { status: 401 }
    );
  }),

  // 日報API
  http.get(/\/reports$/, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: mockReports,
        pagination: {
          currentPage: 1,
          perPage: 20,
          totalPages: 1,
          totalCount: mockReports.length,
        },
      },
    });
  }),

  // 承認待ちAPI
  http.get(/\/approvals/, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: mockReports.filter((r) => r.status === 'submitted'),
        pagination: {
          currentPage: 1,
          perPage: 20,
          totalPages: 1,
          totalCount: 1,
        },
      },
    });
  }),

  // 顧客API
  http.get(/\/customers$/, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: mockCustomers,
        pagination: {
          currentPage: 1,
          perPage: 20,
          totalPages: 1,
          totalCount: mockCustomers.length,
        },
      },
    });
  }),

  // マスタAPI
  http.get(/\/positions/, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: [
          { id: 1, name: '担当', level: 1 },
          { id: 2, name: '課長', level: 2 },
          { id: 3, name: '部長', level: 3 },
        ],
      },
    });
  }),
];

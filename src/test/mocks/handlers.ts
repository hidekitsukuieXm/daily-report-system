/**
 * MSW API モックハンドラー
 */

import { http, HttpResponse } from 'msw';

const BASE_URL = 'https://api.example.com/api/v1';

// サンプルデータ
const mockUser = {
  id: 1,
  name: '山田太郎',
  email: 'yamada@example.com',
  position: { id: 1, name: '担当', level: 1 },
};

const mockCustomers = [
  { id: 1, name: '株式会社ABC', industry: '製造業', isActive: true },
  { id: 2, name: '株式会社XYZ', industry: 'IT・通信', isActive: true },
];

const mockReports = [
  {
    id: 1,
    reportDate: '2024-01-15',
    status: 'submitted',
    salesperson: { id: 1, name: '山田太郎' },
    visitCount: 3,
  },
];

export const handlers = [
  // 認証API
  http.post(`${BASE_URL}/auth/login`, async ({ request }) => {
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

  http.post(`${BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      data: { message: 'ログアウトしました' },
    });
  }),

  http.get(`${BASE_URL}/auth/me`, ({ request }) => {
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

  http.post(`${BASE_URL}/auth/refresh`, async ({ request }) => {
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

  http.put(`${BASE_URL}/auth/password`, async ({ request }) => {
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

    const body = (await request.json()) as {
      current_password: string;
      new_password: string;
    };

    if (body.current_password !== 'password123') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PASSWORD',
            message: '現在のパスワードが正しくありません',
          },
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: { message: 'パスワードを変更しました' },
    });
  }),

  // 日報API
  http.get(`${BASE_URL}/reports`, () => {
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

  http.get(`${BASE_URL}/reports/:id`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        reportDate: '2024-01-15',
        status: 'submitted',
        problem: '課題・相談内容',
        plan: '明日やること',
        salesperson: mockUser,
        visitRecords: [],
        approvalHistories: [],
        comments: [],
      },
    });
  }),

  http.post(`${BASE_URL}/reports`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(
      {
        success: true,
        data: {
          id: 1,
          status: 'draft',
          ...body,
        },
      },
      { status: 201 }
    );
  }),

  // 顧客API
  http.get(`${BASE_URL}/customers`, () => {
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

  // 承認待ちAPI
  http.get(`${BASE_URL}/approvals`, () => {
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

  // 承認処理API
  http.post(`${BASE_URL}/reports/:id/approve`, async ({ params, request }) => {
    const { id } = params;
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

    const body = (await request.json()) as { comment?: string };
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        status: 'manager_approved',
        manager_approved_at: new Date().toISOString(),
        comment: body.comment,
      },
    });
  }),

  // 差戻し処理API
  http.post(`${BASE_URL}/reports/:id/reject`, async ({ params, request }) => {
    const { id } = params;
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

    const body = (await request.json()) as { comment: string };

    if (!body.comment || body.comment.trim() === '') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '差戻し理由を入力してください',
          },
        },
        { status: 422 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        status: 'rejected',
      },
    });
  }),

  // 承認履歴取得API
  http.get(`${BASE_URL}/reports/:id/approval-history`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: 1,
          dailyReportId: Number(id),
          approverId: 2,
          action: 'approved',
          comment: '良い内容です',
          approvalLevel: 'manager',
          createdAt: '2024-01-15T19:00:00Z',
        },
      ],
    });
  }),

  // マスタAPI
  http.get(`${BASE_URL}/positions`, () => {
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

  http.get(`${BASE_URL}/industries`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: [
          { code: 'manufacturing', name: '製造業' },
          { code: 'it', name: 'IT・通信' },
          { code: 'finance', name: '金融・保険' },
        ],
      },
    });
  }),

  http.get(`${BASE_URL}/visit-results`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: [
          { code: 'negotiating', name: '商談中' },
          { code: 'closed_won', name: '成約' },
          { code: 'closed_lost', name: '見送り' },
        ],
      },
    });
  }),
];

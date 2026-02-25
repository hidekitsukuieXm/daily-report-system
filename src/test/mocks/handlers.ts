/**
 * MSW API モックハンドラー
 */

import { http, HttpResponse } from 'msw';

// API client uses relative URL '/api/v1' - MSW will intercept all matching paths
const BASE_URL = '/api/v1';

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

const mockSalespersons = [
  {
    id: 1,
    name: '田中部長',
    email: 'director@example.com',
    positionId: 3,
    managerId: null,
    directorId: null,
    isActive: true,
    position: { id: 3, name: '部長', level: 3 },
    manager: null,
    director: null,
  },
  {
    id: 2,
    name: '鈴木課長',
    email: 'manager@example.com',
    positionId: 2,
    managerId: null,
    directorId: 1,
    isActive: true,
    position: { id: 2, name: '課長', level: 2 },
    manager: null,
    director: { id: 1, name: '田中部長' },
  },
  {
    id: 3,
    name: '山田太郎',
    email: 'yamada@example.com',
    positionId: 1,
    managerId: 2,
    directorId: 1,
    isActive: true,
    position: { id: 1, name: '担当', level: 1 },
    manager: { id: 2, name: '鈴木課長' },
    director: { id: 1, name: '田中部長' },
  },
  {
    id: 4,
    name: '佐藤花子',
    email: 'sato@example.com',
    positionId: 1,
    managerId: 2,
    directorId: 1,
    isActive: false,
    position: { id: 1, name: '担当', level: 1 },
    manager: { id: 2, name: '鈴木課長' },
    director: { id: 1, name: '田中部長' },
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

  // 営業担当者API
  http.get(`${BASE_URL}/salespersons`, ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const positionId = url.searchParams.get('position_id');
    const isActive = url.searchParams.get('is_active');

    let filtered = [...mockSalespersons];

    if (name) {
      filtered = filtered.filter((s) => s.name.includes(name));
    }
    if (positionId) {
      filtered = filtered.filter((s) => s.positionId === Number(positionId));
    }
    if (isActive !== null && isActive !== '') {
      filtered = filtered.filter((s) => s.isActive === (isActive === 'true'));
    }

    return HttpResponse.json({
      success: true,
      data: {
        items: filtered,
        pagination: {
          currentPage: 1,
          perPage: 20,
          totalPages: 1,
          totalCount: filtered.length,
        },
      },
    });
  }),

  http.get(`${BASE_URL}/salespersons/:id`, ({ params }) => {
    const { id } = params;
    const salesperson = mockSalespersons.find((s) => s.id === Number(id));

    if (!salesperson) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '営業担当者が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: salesperson,
    });
  }),
];

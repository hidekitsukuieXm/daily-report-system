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
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    name: 'DEF株式会社',
    address: '大阪府大阪市3-3-3',
    phone: '06-3456-7890',
    industry: '小売・流通',
    isActive: true,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
  },
  {
    id: 4,
    name: 'GHI商事',
    address: '愛知県名古屋市4-4-4',
    phone: '052-4567-8901',
    industry: '金融・保険',
    isActive: false,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
];

let nextCustomerId = 5;

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
  http.get(`${BASE_URL}/customers`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '1', 10);
    const perPage = parseInt(url.searchParams.get('per_page') ?? '20', 10);
    const nameFilter = url.searchParams.get('name');
    const industryFilter = url.searchParams.get('industry');
    const isActiveFilter = url.searchParams.get('is_active');

    let filteredCustomers = [...mockCustomers];

    // 名前フィルタ（部分一致）
    if (nameFilter) {
      filteredCustomers = filteredCustomers.filter((c) =>
        c.name.includes(nameFilter)
      );
    }

    // 業種フィルタ
    if (industryFilter) {
      filteredCustomers = filteredCustomers.filter(
        (c) => c.industry === industryFilter
      );
    }

    // 有効フラグフィルタ
    if (isActiveFilter !== null) {
      const isActive = isActiveFilter === 'true';
      filteredCustomers = filteredCustomers.filter(
        (c) => c.isActive === isActive
      );
    }

    const totalCount = filteredCustomers.length;
    const totalPages = Math.ceil(totalCount / perPage);
    const startIndex = (page - 1) * perPage;
    const paginatedCustomers = filteredCustomers.slice(
      startIndex,
      startIndex + perPage
    );

    return HttpResponse.json({
      success: true,
      data: {
        items: paginatedCustomers,
        pagination: {
          currentPage: page,
          perPage: perPage,
          totalPages: totalPages,
          totalCount: totalCount,
        },
      },
    });
  }),

  http.get(`${BASE_URL}/customers/:id`, ({ params }) => {
    const { id } = params;
    const customerId = Number(id);
    const customer = mockCustomers.find((c) => c.id === customerId);

    if (!customer) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '顧客が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: customer,
    });
  }),

  http.post(`${BASE_URL}/customers`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      address?: string;
      phone?: string;
      industry?: string;
    };

    // バリデーション
    if (!body.name || body.name.trim() === '') {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '顧客名を入力してください',
          },
        },
        { status: 422 }
      );
    }

    const newCustomer = {
      id: nextCustomerId++,
      name: body.name,
      address: body.address ?? null,
      phone: body.phone ?? null,
      industry: body.industry ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockCustomers.push(newCustomer);

    return HttpResponse.json(
      {
        success: true,
        data: newCustomer,
      },
      { status: 201 }
    );
  }),

  http.put(`${BASE_URL}/customers/:id`, async ({ params, request }) => {
    const { id } = params;
    const customerId = Number(id);
    const customerIndex = mockCustomers.findIndex((c) => c.id === customerId);

    if (customerIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '顧客が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    const body = (await request.json()) as {
      name?: string;
      address?: string;
      phone?: string;
      industry?: string;
      is_active?: boolean;
    };

    const existingCustomer = mockCustomers[customerIndex];
    const updatedCustomer = {
      ...existingCustomer,
      name: body.name ?? existingCustomer.name,
      address: body.address ?? existingCustomer.address,
      phone: body.phone ?? existingCustomer.phone,
      industry: body.industry ?? existingCustomer.industry,
      isActive: body.is_active ?? existingCustomer.isActive,
      updatedAt: new Date().toISOString(),
    };

    mockCustomers[customerIndex] = updatedCustomer;

    return HttpResponse.json({
      success: true,
      data: updatedCustomer,
    });
  }),

  http.delete(`${BASE_URL}/customers/:id`, ({ params }) => {
    const { id } = params;
    const customerId = Number(id);
    const customerIndex = mockCustomers.findIndex((c) => c.id === customerId);

    if (customerIndex === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: '顧客が見つかりません',
          },
        },
        { status: 404 }
      );
    }

    // 論理削除（isActiveをfalseに設定）
    mockCustomers[customerIndex].isActive = false;
    mockCustomers[customerIndex].updatedAt = new Date().toISOString();

    return new HttpResponse(null, { status: 204 });
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
];

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

const mockPositions = [
  {
    id: 1,
    name: '担当',
    level: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: '課長',
    level: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    name: '部長',
    level: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

type MockSalesperson = {
  id: number;
  name: string;
  email: string;
  positionId: number;
  managerId: number | null;
  directorId: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  position: (typeof mockPositions)[number] | undefined;
  manager: { id: number; name: string } | null;
  director: { id: number; name: string } | null;
};

const mockSalespersons: MockSalesperson[] = [
  {
    id: 1,
    name: '田中 部長',
    email: 'director@example.com',
    positionId: 3,
    managerId: null,
    directorId: null,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    position: mockPositions[2],
    manager: null,
    director: null,
  },
  {
    id: 2,
    name: '鈴木 課長',
    email: 'manager@example.com',
    positionId: 2,
    managerId: null,
    directorId: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    position: mockPositions[1],
    manager: null,
    director: { id: 1, name: '田中 部長' },
  },
  {
    id: 3,
    name: '山田 太郎',
    email: 'yamada@example.com',
    positionId: 1,
    managerId: 2,
    directorId: 1,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    position: mockPositions[0],
    manager: { id: 2, name: '鈴木 課長' },
    director: { id: 1, name: '田中 部長' },
  },
  {
    id: 4,
    name: '佐藤 花子',
    email: 'sato@example.com',
    positionId: 1,
    managerId: 2,
    directorId: 1,
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    position: mockPositions[0],
    manager: { id: 2, name: '鈴木 課長' },
    director: { id: 1, name: '田中 部長' },
  },
];

let nextSalespersonId = 5;

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

const mockReportDetail = {
  id: 1,
  reportDate: '2024-01-15',
  status: 'submitted',
  problem: '競合他社の価格攻勢が激しい',
  plan: 'ABC社への見積書作成',
  submittedAt: '2024-01-15T18:00:00Z',
  managerApprovedAt: null,
  directorApprovedAt: null,
  salesperson: {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    positionId: 1,
    position: { id: 1, name: '担当', level: 1 },
  },
  visitRecords: [
    {
      id: 1,
      dailyReportId: 1,
      customerId: 1,
      visitTime: '2024-01-15T10:00:00Z',
      content:
        '新商品の提案を実施。担当者は興味を示しており、次回見積書を持参予定。',
      result: 'negotiating',
      customer: { id: 1, name: '株式会社ABC' },
      attachments: [
        {
          id: 1,
          visitRecordId: 1,
          fileName: 'proposal.pdf',
          filePath: '/uploads/proposal.pdf',
          contentType: 'application/pdf',
          fileSize: 1024000,
          createdAt: '2024-01-15T10:30:00Z',
        },
      ],
      createdAt: '2024-01-15T17:00:00Z',
      updatedAt: '2024-01-15T17:00:00Z',
    },
    {
      id: 2,
      dailyReportId: 1,
      customerId: 2,
      visitTime: '2024-01-15T14:00:00Z',
      content: '定期訪問。特に問題なし。',
      result: 'information_gathering',
      customer: { id: 2, name: '株式会社XYZ' },
      attachments: [],
      createdAt: '2024-01-15T17:00:00Z',
      updatedAt: '2024-01-15T17:00:00Z',
    },
  ],
  approvalHistories: [],
  comments: [],
  createdAt: '2024-01-15T17:00:00Z',
  updatedAt: '2024-01-15T18:00:00Z',
};

let nextReportId = 4;
let nextVisitId = 3;
let nextAttachmentId = 2;

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
        ...mockReportDetail,
        id: Number(id),
      },
    });
  }),

  http.post(`${BASE_URL}/reports`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newId = nextReportId++;
    return HttpResponse.json(
      {
        success: true,
        data: {
          id: newId,
          status: 'draft',
          salesperson: mockUser,
          visitRecords: [],
          approvalHistories: [],
          comments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...body,
        },
      },
      { status: 201 }
    );
  }),

  http.put(`${BASE_URL}/reports/:id`, async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        ...mockReportDetail,
        id: Number(id),
        ...body,
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  http.delete(`${BASE_URL}/reports/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${BASE_URL}/reports/:id/submit`, ({ params }) => {
    const { id } = params;
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      },
    });
  }),

  // 訪問記録API
  http.get(`${BASE_URL}/reports/:reportId/visits`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: mockReportDetail.visitRecords,
      },
    });
  }),

  http.post(`${BASE_URL}/reports/:reportId/visits`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const newId = nextVisitId++;
    return HttpResponse.json(
      {
        success: true,
        data: {
          id: newId,
          customer: mockCustomers[0],
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...body,
        },
      },
      { status: 201 }
    );
  }),

  http.put(`${BASE_URL}/visits/:id`, async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      success: true,
      data: {
        id: Number(id),
        customer: mockCustomers[0],
        attachments: [],
        updatedAt: new Date().toISOString(),
        ...body,
      },
    });
  }),

  http.delete(`${BASE_URL}/visits/:id`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // 添付ファイルAPI
  http.post(`${BASE_URL}/visits/:visitId/attachments`, () => {
    const newId = nextAttachmentId++;
    return HttpResponse.json(
      {
        success: true,
        data: {
          id: newId,
          file_name: 'uploaded_file.pdf',
          file_size: 1024000,
          content_type: 'application/pdf',
          download_url: `/api/v1/attachments/${newId}`,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  http.get(`${BASE_URL}/attachments/:id`, () => {
    return new HttpResponse(new Blob(['file content']), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="file.pdf"',
      },
    });
  }),

  http.delete(`${BASE_URL}/attachments/:id`, () => {
    return new HttpResponse(null, { status: 204 });
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

  http.get(`${BASE_URL}/customers/:id`, ({ params }) => {
    const { id } = params;
    const customer = mockCustomers.find((c) => c.id === Number(id));
    if (customer) {
      return HttpResponse.json({
        success: true,
        data: customer,
      });
    }
    return HttpResponse.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: '顧客が見つかりません' },
      },
      { status: 404 }
    );
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
      data: mockPositions,
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
          { code: 'retail', name: '小売・流通' },
          { code: 'service', name: 'サービス' },
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
          { code: 'information_gathering', name: '情報収集' },
          { code: 'other', name: 'その他' },
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
      filtered = filtered.filter((s) =>
        s.name.toLowerCase().includes(name.toLowerCase())
      );
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

  http.get(`${BASE_URL}/salespersons/managers`, () => {
    const managers = mockSalespersons
      .filter((s) => s.position?.level === 2)
      .map((s) => ({ id: s.id, name: s.name }));
    return HttpResponse.json({
      success: true,
      data: managers,
    });
  }),

  http.get(`${BASE_URL}/salespersons/directors`, () => {
    const directors = mockSalespersons
      .filter((s) => s.position?.level === 3)
      .map((s) => ({ id: s.id, name: s.name }));
    return HttpResponse.json({
      success: true,
      data: directors,
    });
  }),

  http.get(`${BASE_URL}/salespersons/:id`, ({ params }) => {
    const { id } = params;
    const salesperson = mockSalespersons.find((s) => s.id === Number(id));
    if (salesperson) {
      return HttpResponse.json({
        success: true,
        data: salesperson,
      });
    }
    return HttpResponse.json(
      {
        success: false,
        error: { code: 'NOT_FOUND', message: '営業担当者が見つかりません' },
      },
      { status: 404 }
    );
  }),

  http.post(`${BASE_URL}/salespersons`, async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      position_id?: number;
      manager_id?: number | null;
      director_id?: number | null;
    };

    // メール重複チェック
    const existingEmail = mockSalespersons.find((s) => s.email === body.email);
    if (existingEmail) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'このメールアドレスは既に登録されています',
          },
        },
        { status: 409 }
      );
    }

    const newId = nextSalespersonId++;
    const position = mockPositions.find((p) => p.id === body.position_id);
    const manager = body.manager_id
      ? mockSalespersons.find((s) => s.id === body.manager_id)
      : null;
    const director = body.director_id
      ? mockSalespersons.find((s) => s.id === body.director_id)
      : null;

    const newSalesperson = {
      id: newId,
      name: body.name ?? '',
      email: body.email ?? '',
      positionId: body.position_id ?? 1,
      managerId: body.manager_id ?? null,
      directorId: body.director_id ?? null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      position: position ?? mockPositions[0],
      manager: manager ? { id: manager.id, name: manager.name } : null,
      director: director ? { id: director.id, name: director.name } : null,
    };

    mockSalespersons.push(newSalesperson);

    return HttpResponse.json(
      {
        success: true,
        data: newSalesperson,
      },
      { status: 201 }
    );
  }),

  http.put(`${BASE_URL}/salespersons/:id`, async ({ request, params }) => {
    const { id } = params;
    const body = (await request.json()) as Record<string, unknown>;
    const index = mockSalespersons.findIndex((s) => s.id === Number(id));

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '営業担当者が見つかりません' },
        },
        { status: 404 }
      );
    }

    // メール重複チェック（自分以外）
    if (body.email) {
      const existingEmail = mockSalespersons.find(
        (s) => s.email === body.email && s.id !== Number(id)
      );
      if (existingEmail) {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_EMAIL',
              message: 'このメールアドレスは既に登録されています',
            },
          },
          { status: 409 }
        );
      }
    }

    const current = mockSalespersons[index]!;
    const updated = {
      ...current,
      name: (body.name as string) ?? current.name,
      email: (body.email as string) ?? current.email,
      positionId: (body.position_id as number) ?? current.positionId,
      managerId:
        body.manager_id !== undefined
          ? (body.manager_id as number | null)
          : current.managerId,
      directorId:
        body.director_id !== undefined
          ? (body.director_id as number | null)
          : current.directorId,
      isActive:
        body.is_active !== undefined
          ? (body.is_active as boolean)
          : current.isActive,
      updatedAt: new Date().toISOString(),
    };

    mockSalespersons[index] = updated;

    return HttpResponse.json({
      success: true,
      data: updated,
    });
  }),

  http.delete(`${BASE_URL}/salespersons/:id`, ({ params }) => {
    const { id } = params;
    const index = mockSalespersons.findIndex((s) => s.id === Number(id));

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: '営業担当者が見つかりません' },
        },
        { status: 404 }
      );
    }

    mockSalespersons.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];

/**
 * APIスキーマ定義
 * Zodによるリクエスト/レスポンスのバリデーションスキーマ
 */

import { z } from 'zod';

// ========================================
// Enum Schemas
// ========================================

/** 日報ステータス */
export const reportStatusSchema = z.enum([
  'draft',
  'submitted',
  'manager_approved',
  'approved',
  'rejected',
]);

/** 訪問結果 */
export const visitResultSchema = z.enum([
  'negotiating',
  'closed_won',
  'closed_lost',
  'information_gathering',
  'other',
]);

/** 承認アクション */
export const approvalActionSchema = z.enum(['approved', 'rejected']);

/** 承認レベル */
export const approvalLevelSchema = z.enum(['manager', 'director']);

// ========================================
// Common Schemas
// ========================================

/** ページネーションクエリ */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
});

/** ソートクエリ */
export const sortQuerySchema = z.object({
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/** ID パラメータ */
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ========================================
// 認証API Schemas
// ========================================

/** ログインリクエスト */
export const loginRequestSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
  remember: z.boolean().default(false),
});

/** トークンリフレッシュリクエスト */
export const refreshTokenRequestSchema = z.object({
  refresh_token: z.string().min(1),
});

/** ログインレスポンス */
export const loginResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number(),
  user: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    position: z.object({
      id: z.number(),
      name: z.string(),
      level: z.number(),
    }),
  }),
});

// ========================================
// 日報API Schemas
// ========================================

/** 日報検索クエリ */
export const reportSearchQuerySchema = paginationQuerySchema
  .merge(sortQuerySchema)
  .extend({
    date_from: z.string().date().optional(),
    date_to: z.string().date().optional(),
    salesperson_id: z.coerce.number().int().positive().optional(),
    status: reportStatusSchema.optional(),
  });

/** 訪問記録入力 */
export const visitRecordInputSchema = z.object({
  customer_id: z.number().int().positive('顧客を選択してください'),
  visit_time: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, '時刻はHH:MM形式で入力してください')
    .optional()
    .nullable(),
  content: z
    .string()
    .min(1, '訪問内容を入力してください')
    .max(2000, '訪問内容は2000文字以内で入力してください'),
  result: visitResultSchema.optional().nullable(),
});

/** 日報作成リクエスト */
export const createReportRequestSchema = z.object({
  report_date: z.string().date('有効な日付を入力してください'),
  problem: z.string().max(2000).optional().nullable(),
  plan: z.string().max(2000).optional().nullable(),
  visits: z.array(visitRecordInputSchema).optional(),
});

/** 日報更新リクエスト */
export const updateReportRequestSchema = z.object({
  problem: z.string().max(2000).optional().nullable(),
  plan: z.string().max(2000).optional().nullable(),
});

// ========================================
// 訪問記録API Schemas
// ========================================

/** 訪問記録作成リクエスト */
export const createVisitRequestSchema = visitRecordInputSchema;

/** 訪問記録更新リクエスト */
export const updateVisitRequestSchema = visitRecordInputSchema.partial();

// ========================================
// 承認API Schemas
// ========================================

/** 承認リクエスト */
export const approveRequestSchema = z.object({
  comment: z.string().max(2000).optional(),
});

/** 差戻しリクエスト */
export const rejectRequestSchema = z.object({
  comment: z
    .string()
    .min(1, '差戻し理由を入力してください')
    .max(2000, '差戻し理由は2000文字以内で入力してください'),
});

// ========================================
// コメントAPI Schemas
// ========================================

/** コメント作成リクエスト */
export const createCommentRequestSchema = z.object({
  content: z
    .string()
    .min(1, 'コメントを入力してください')
    .max(2000, 'コメントは2000文字以内で入力してください'),
});

/** コメント更新リクエスト */
export const updateCommentRequestSchema = createCommentRequestSchema;

// ========================================
// 顧客マスタAPI Schemas
// ========================================

/** 顧客検索クエリ */
export const customerSearchQuerySchema = paginationQuerySchema
  .merge(sortQuerySchema)
  .extend({
    name: z.string().optional(),
    industry: z.string().optional(),
    is_active: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
  });

/** 顧客作成リクエスト */
export const createCustomerRequestSchema = z.object({
  name: z
    .string()
    .min(1, '顧客名を入力してください')
    .max(200, '顧客名は200文字以内で入力してください'),
  address: z.string().max(500).optional().nullable(),
  phone: z
    .string()
    .max(20)
    .regex(/^[\d\-+()]*$/, '電話番号の形式が正しくありません')
    .optional()
    .nullable(),
  industry: z.string().max(100).optional().nullable(),
});

/** 顧客更新リクエスト */
export const updateCustomerRequestSchema = createCustomerRequestSchema
  .partial()
  .extend({
    is_active: z.boolean().optional(),
  });

// ========================================
// 営業担当者マスタAPI Schemas
// ========================================

/** 営業担当者検索クエリ */
export const salespersonSearchQuerySchema = paginationQuerySchema.extend({
  name: z.string().optional(),
  position_id: z.coerce.number().int().positive().optional(),
  is_active: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

/** 営業担当者作成リクエスト */
export const createSalespersonRequestSchema = z.object({
  name: z
    .string()
    .min(1, '氏名を入力してください')
    .max(100, '氏名は100文字以内で入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください').max(255),
  position_id: z.number().int().positive('役職を選択してください'),
  manager_id: z.number().int().positive().optional().nullable(),
  director_id: z.number().int().positive().optional().nullable(),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100),
});

/** 営業担当者更新リクエスト */
export const updateSalespersonRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().max(255).optional(),
  position_id: z.number().int().positive().optional(),
  manager_id: z.number().int().positive().optional().nullable(),
  director_id: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().optional(),
  reset_password: z.boolean().optional(),
});

// ========================================
// API Response Wrapper Schemas
// ========================================

/** 成功レスポンス */
export const successResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
  });

/** エラーレスポンス */
export const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

// ========================================
// Type Exports
// ========================================

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type LoginResponse = z.infer<typeof loginResponseSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenRequestSchema>;

export type ReportSearchQuery = z.infer<typeof reportSearchQuerySchema>;
export type CreateReportRequest = z.infer<typeof createReportRequestSchema>;
export type UpdateReportRequest = z.infer<typeof updateReportRequestSchema>;
export type VisitRecordInput = z.infer<typeof visitRecordInputSchema>;

export type CreateVisitRequest = z.infer<typeof createVisitRequestSchema>;
export type UpdateVisitRequest = z.infer<typeof updateVisitRequestSchema>;

export type ApproveRequest = z.infer<typeof approveRequestSchema>;
export type RejectRequest = z.infer<typeof rejectRequestSchema>;

export type CreateCommentRequest = z.infer<typeof createCommentRequestSchema>;
export type UpdateCommentRequest = z.infer<typeof updateCommentRequestSchema>;

export type CustomerSearchQuery = z.infer<typeof customerSearchQuerySchema>;
export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>;
export type UpdateCustomerRequest = z.infer<typeof updateCustomerRequestSchema>;

export type SalespersonSearchQuery = z.infer<
  typeof salespersonSearchQuerySchema
>;
export type CreateSalespersonRequest = z.infer<
  typeof createSalespersonRequestSchema
>;
export type UpdateSalespersonRequest = z.infer<
  typeof updateSalespersonRequestSchema
>;

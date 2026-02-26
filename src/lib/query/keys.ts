/**
 * TanStack Query - Query Key定数
 * キャッシュの一貫性とクエリの無効化を容易にするための定数定義
 */

/**
 * 認証関連のQuery Keys
 */
export const authKeys = {
  all: ['auth'] as const,
  me: () => [...authKeys.all, 'me'] as const,
} as const;

/**
 * 日報関連のQuery Keys
 */
export const reportKeys = {
  all: ['reports'] as const,
  lists: () => [...reportKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...reportKeys.lists(), filters] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: number) => [...reportKeys.details(), id] as const,
} as const;

/**
 * 訪問記録関連のQuery Keys
 */
export const visitKeys = {
  all: ['visits'] as const,
  lists: () => [...visitKeys.all, 'list'] as const,
  list: (reportId: number) => [...visitKeys.lists(), reportId] as const,
  details: () => [...visitKeys.all, 'detail'] as const,
  detail: (id: number) => [...visitKeys.details(), id] as const,
} as const;

/**
 * 添付ファイル関連のQuery Keys
 */
export const attachmentKeys = {
  all: ['attachments'] as const,
  lists: () => [...attachmentKeys.all, 'list'] as const,
  list: (visitId: number) => [...attachmentKeys.lists(), visitId] as const,
  details: () => [...attachmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...attachmentKeys.details(), id] as const,
} as const;

/**
 * 承認関連のQuery Keys
 */
export const approvalKeys = {
  all: ['approvals'] as const,
  lists: () => [...approvalKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...approvalKeys.lists(), filters] as const,
} as const;

/**
 * コメント関連のQuery Keys
 */
export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (reportId: number) => [...commentKeys.lists(), reportId] as const,
} as const;

/**
 * 顧客マスタ関連のQuery Keys
 */
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: number) => [...customerKeys.details(), id] as const,
} as const;

/**
 * 営業担当者マスタ関連のQuery Keys
 */
export const salespersonKeys = {
  all: ['salespersons'] as const,
  lists: () => [...salespersonKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...salespersonKeys.lists(), filters] as const,
  details: () => [...salespersonKeys.all, 'detail'] as const,
  detail: (id: number) => [...salespersonKeys.details(), id] as const,
} as const;

/**
 * マスタデータ関連のQuery Keys
 */
export const masterKeys = {
  all: ['masters'] as const,
  positions: () => [...masterKeys.all, 'positions'] as const,
  industries: () => [...masterKeys.all, 'industries'] as const,
  visitResults: () => [...masterKeys.all, 'visitResults'] as const,
} as const;

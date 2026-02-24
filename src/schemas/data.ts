/**
 * データスキーマ定義
 * Prismaモデルに対応するTypeScript型定義
 */

// ========================================
// Enums
// ========================================

/** 日報ステータス */
export const ReportStatus = {
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  MANAGER_APPROVED: 'manager_approved',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ReportStatus = (typeof ReportStatus)[keyof typeof ReportStatus];

/** 訪問結果 */
export const VisitResult = {
  NEGOTIATING: 'negotiating',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
  INFORMATION_GATHERING: 'information_gathering',
  OTHER: 'other',
} as const;

export type VisitResult = (typeof VisitResult)[keyof typeof VisitResult];

/** 承認アクション */
export const ApprovalAction = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type ApprovalAction =
  (typeof ApprovalAction)[keyof typeof ApprovalAction];

/** 承認レベル */
export const ApprovalLevel = {
  MANAGER: 'manager',
  DIRECTOR: 'director',
} as const;

export type ApprovalLevel = (typeof ApprovalLevel)[keyof typeof ApprovalLevel];

// ========================================
// Base Types
// ========================================

/** 役職 */
export type Position = {
  id: number;
  name: string;
  level: number;
  createdAt: Date;
  updatedAt: Date;
};

/** 営業担当者 */
export type Salesperson = {
  id: number;
  name: string;
  email: string;
  positionId: number;
  managerId: number | null;
  directorId: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** 顧客 */
export type Customer = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  industry: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** 日報 */
export type DailyReport = {
  id: number;
  salespersonId: number;
  reportDate: Date;
  problem: string | null;
  plan: string | null;
  status: ReportStatus;
  submittedAt: Date | null;
  managerApprovedAt: Date | null;
  directorApprovedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** 訪問記録 */
export type VisitRecord = {
  id: number;
  dailyReportId: number;
  customerId: number;
  visitTime: Date | null;
  content: string;
  result: VisitResult | null;
  createdAt: Date;
  updatedAt: Date;
};

/** 添付ファイル */
export type Attachment = {
  id: number;
  visitRecordId: number;
  fileName: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  createdAt: Date;
};

/** 承認履歴 */
export type ApprovalHistory = {
  id: number;
  dailyReportId: number;
  approverId: number;
  action: ApprovalAction;
  comment: string | null;
  approvalLevel: ApprovalLevel;
  createdAt: Date;
};

/** コメント */
export type Comment = {
  id: number;
  dailyReportId: number;
  commenterId: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
};

// ========================================
// Nested/Joined Types (API Response用)
// ========================================

/** 役職情報付き営業担当者 */
export type SalespersonWithPosition = Salesperson & {
  position: Position;
};

/** 上長情報付き営業担当者 */
export type SalespersonWithRelations = SalespersonWithPosition & {
  manager: Pick<Salesperson, 'id' | 'name'> | null;
  director: Pick<Salesperson, 'id' | 'name'> | null;
};

/** 顧客情報付き訪問記録 */
export type VisitRecordWithCustomer = VisitRecord & {
  customer: Pick<Customer, 'id' | 'name'>;
  attachments: Attachment[];
};

/** 承認者情報付き承認履歴 */
export type ApprovalHistoryWithApprover = ApprovalHistory & {
  approver: Pick<Salesperson, 'id' | 'name'>;
};

/** コメント者情報付きコメント */
export type CommentWithCommenter = Comment & {
  commenter: Pick<Salesperson, 'id' | 'name'> & {
    position: Pick<Position, 'id' | 'name'>;
  };
};

/** 詳細情報付き日報 */
export type DailyReportDetail = DailyReport & {
  salesperson: SalespersonWithPosition;
  visitRecords: VisitRecordWithCustomer[];
  approvalHistories: ApprovalHistoryWithApprover[];
  comments: CommentWithCommenter[];
};

/** 一覧用日報 */
export type DailyReportSummary = Pick<
  DailyReport,
  'id' | 'reportDate' | 'status' | 'submittedAt' | 'createdAt' | 'updatedAt'
> & {
  salesperson: Pick<Salesperson, 'id' | 'name'>;
  visitCount: number;
};

// ========================================
// Pagination
// ========================================

/** ページネーション情報 */
export type Pagination = {
  currentPage: number;
  perPage: number;
  totalPages: number;
  totalCount: number;
};

/** ページネーション付きリスト */
export type PaginatedList<T> = {
  items: T[];
  pagination: Pagination;
};

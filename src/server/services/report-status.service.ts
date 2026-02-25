/**
 * 日報ステータス遷移サービス
 * ステータス遷移のビジネスロジックを実装
 */

import type { ReportStatus } from '@/schemas/data';

// エラーコード定義
export const ReportStatusErrorCode = {
  NOT_FOUND: 'NOT_FOUND',
  INVALID_STATUS: 'INVALID_STATUS',
  NO_VISITS: 'NO_VISITS',
  ALREADY_APPROVED: 'ALREADY_APPROVED',
  FORBIDDEN: 'FORBIDDEN',
} as const;

export type ReportStatusErrorCode =
  (typeof ReportStatusErrorCode)[keyof typeof ReportStatusErrorCode];

// エラークラス
export class ReportStatusError extends Error {
  constructor(
    public code: ReportStatusErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ReportStatusError';
  }
}

// 日報データの型（DB取得後の形式）
export type ReportForStatusTransition = {
  id: number;
  salespersonId: number;
  status: ReportStatus;
  submittedAt: Date | null;
  visitRecordCount: number;
};

// 提出結果の型
export type SubmitResult = {
  id: number;
  status: 'submitted';
  submittedAt: string;
};

// 取り下げ結果の型
export type WithdrawResult = {
  id: number;
  status: 'draft';
};

/**
 * 日報を提出可能かどうかを検証
 * @param report 日報データ
 * @param currentUserId 操作を行うユーザーのID
 * @throws ReportStatusError バリデーションエラー時
 */
export function validateSubmit(
  report: ReportForStatusTransition,
  currentUserId: number
): void {
  // 自分の日報のみ提出可能
  if (report.salespersonId !== currentUserId) {
    throw new ReportStatusError(
      ReportStatusErrorCode.FORBIDDEN,
      '他のユーザーの日報を提出することはできません'
    );
  }

  // 下書きまたは差戻しからのみ提出可能
  if (report.status !== 'draft' && report.status !== 'rejected') {
    throw new ReportStatusError(
      ReportStatusErrorCode.INVALID_STATUS,
      `この状態(${report.status})では提出できません`
    );
  }

  // 訪問記録が1件以上必要
  if (report.visitRecordCount < 1) {
    throw new ReportStatusError(
      ReportStatusErrorCode.NO_VISITS,
      '訪問記録を1件以上入力してください'
    );
  }
}

/**
 * 日報を取り下げ可能かどうかを検証
 * @param report 日報データ
 * @param currentUserId 操作を行うユーザーのID
 * @throws ReportStatusError バリデーションエラー時
 */
export function validateWithdraw(
  report: ReportForStatusTransition,
  currentUserId: number
): void {
  // 自分の日報のみ取り下げ可能
  if (report.salespersonId !== currentUserId) {
    throw new ReportStatusError(
      ReportStatusErrorCode.FORBIDDEN,
      '他のユーザーの日報を取り下げることはできません'
    );
  }

  // 提出済からのみ取り下げ可能（未承認の場合のみ）
  if (report.status !== 'submitted') {
    if (report.status === 'manager_approved' || report.status === 'approved') {
      throw new ReportStatusError(
        ReportStatusErrorCode.ALREADY_APPROVED,
        '既に承認された日報は取り下げできません'
      );
    }
    throw new ReportStatusError(
      ReportStatusErrorCode.INVALID_STATUS,
      `この状態(${report.status})では取り下げできません`
    );
  }
}

/**
 * ステータス遷移が有効かどうかをチェック
 * @param currentStatus 現在のステータス
 * @param targetStatus 遷移先のステータス
 * @returns 遷移が有効かどうか
 */
export function isValidTransition(
  currentStatus: ReportStatus,
  targetStatus: ReportStatus
): boolean {
  const validTransitions: Record<ReportStatus, ReportStatus[]> = {
    draft: ['submitted'],
    submitted: ['draft', 'manager_approved', 'rejected'],
    manager_approved: ['approved', 'rejected'],
    approved: [],
    rejected: ['submitted'],
  };

  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
}

/**
 * 提出処理用の更新データを生成
 */
export function createSubmitUpdateData(): {
  status: 'submitted';
  submittedAt: Date;
} {
  return {
    status: 'submitted' as const,
    submittedAt: new Date(),
  };
}

/**
 * 取り下げ処理用の更新データを生成
 */
export function createWithdrawUpdateData(): {
  status: 'draft';
  submittedAt: null;
} {
  return {
    status: 'draft' as const,
    submittedAt: null,
  };
}

/**
 * 日報ステータス遷移サービスのテスト
 */

import { describe, expect, it } from 'vitest';

import {
  createSubmitUpdateData,
  createWithdrawUpdateData,
  isValidTransition,
  ReportStatusError,
  ReportStatusErrorCode,
  validateSubmit,
  validateWithdraw,
} from './report-status.service';

import type { ReportForStatusTransition } from './report-status.service';

describe('report-status.service', () => {
  describe('validateSubmit', () => {
    const createReport = (
      overrides: Partial<ReportForStatusTransition> = {}
    ): ReportForStatusTransition => ({
      id: 1,
      salespersonId: 1,
      status: 'draft',
      submittedAt: null,
      visitRecordCount: 2,
      ...overrides,
    });

    it('下書き状態で訪問記録があれば提出可能', () => {
      const report = createReport();
      expect(() => validateSubmit(report, 1)).not.toThrow();
    });

    it('差戻し状態で訪問記録があれば提出可能', () => {
      const report = createReport({ status: 'rejected' });
      expect(() => validateSubmit(report, 1)).not.toThrow();
    });

    it('他のユーザーの日報は提出不可', () => {
      const report = createReport();
      expect(() => validateSubmit(report, 2)).toThrow(ReportStatusError);
      expect(() => validateSubmit(report, 2)).toThrow(
        '他のユーザーの日報を提出することはできません'
      );
    });

    it('提出済の日報は提出不可', () => {
      const report = createReport({ status: 'submitted' });
      expect(() => validateSubmit(report, 1)).toThrow(ReportStatusError);
      expect(() => validateSubmit(report, 1)).toThrow('この状態');
    });

    it('課長承認済の日報は提出不可', () => {
      const report = createReport({ status: 'manager_approved' });
      expect(() => validateSubmit(report, 1)).toThrow(ReportStatusError);
    });

    it('承認完了の日報は提出不可', () => {
      const report = createReport({ status: 'approved' });
      expect(() => validateSubmit(report, 1)).toThrow(ReportStatusError);
    });

    it('訪問記録がない日報は提出不可', () => {
      const report = createReport({ visitRecordCount: 0 });
      expect(() => validateSubmit(report, 1)).toThrow(ReportStatusError);
      expect(() => validateSubmit(report, 1)).toThrow(
        '訪問記録を1件以上入力してください'
      );
    });

    it('エラーコードが正しく設定される（権限エラー）', () => {
      const report = createReport();
      try {
        validateSubmit(report, 2);
      } catch (e) {
        expect(e).toBeInstanceOf(ReportStatusError);
        expect((e as ReportStatusError).code).toBe(
          ReportStatusErrorCode.FORBIDDEN
        );
      }
    });

    it('エラーコードが正しく設定される（訪問記録なし）', () => {
      const report = createReport({ visitRecordCount: 0 });
      try {
        validateSubmit(report, 1);
      } catch (e) {
        expect(e).toBeInstanceOf(ReportStatusError);
        expect((e as ReportStatusError).code).toBe(
          ReportStatusErrorCode.NO_VISITS
        );
      }
    });

    it('エラーコードが正しく設定される（不正なステータス）', () => {
      const report = createReport({ status: 'submitted' });
      try {
        validateSubmit(report, 1);
      } catch (e) {
        expect(e).toBeInstanceOf(ReportStatusError);
        expect((e as ReportStatusError).code).toBe(
          ReportStatusErrorCode.INVALID_STATUS
        );
      }
    });
  });

  describe('validateWithdraw', () => {
    const createReport = (
      overrides: Partial<ReportForStatusTransition> = {}
    ): ReportForStatusTransition => ({
      id: 1,
      salespersonId: 1,
      status: 'submitted',
      submittedAt: new Date(),
      visitRecordCount: 2,
      ...overrides,
    });

    it('提出済状態であれば取り下げ可能', () => {
      const report = createReport();
      expect(() => validateWithdraw(report, 1)).not.toThrow();
    });

    it('他のユーザーの日報は取り下げ不可', () => {
      const report = createReport();
      expect(() => validateWithdraw(report, 2)).toThrow(ReportStatusError);
      expect(() => validateWithdraw(report, 2)).toThrow(
        '他のユーザーの日報を取り下げることはできません'
      );
    });

    it('下書き状態の日報は取り下げ不可', () => {
      const report = createReport({ status: 'draft' });
      expect(() => validateWithdraw(report, 1)).toThrow(ReportStatusError);
      expect(() => validateWithdraw(report, 1)).toThrow('この状態');
    });

    it('課長承認済の日報は取り下げ不可（既に承認済みエラー）', () => {
      const report = createReport({ status: 'manager_approved' });
      expect(() => validateWithdraw(report, 1)).toThrow(ReportStatusError);
      expect(() => validateWithdraw(report, 1)).toThrow(
        '既に承認された日報は取り下げできません'
      );
    });

    it('承認完了の日報は取り下げ不可（既に承認済みエラー）', () => {
      const report = createReport({ status: 'approved' });
      expect(() => validateWithdraw(report, 1)).toThrow(ReportStatusError);
      expect(() => validateWithdraw(report, 1)).toThrow(
        '既に承認された日報は取り下げできません'
      );
    });

    it('差戻し状態の日報は取り下げ不可', () => {
      const report = createReport({ status: 'rejected' });
      expect(() => validateWithdraw(report, 1)).toThrow(ReportStatusError);
    });

    it('エラーコードが正しく設定される（権限エラー）', () => {
      const report = createReport();
      try {
        validateWithdraw(report, 2);
      } catch (e) {
        expect(e).toBeInstanceOf(ReportStatusError);
        expect((e as ReportStatusError).code).toBe(
          ReportStatusErrorCode.FORBIDDEN
        );
      }
    });

    it('エラーコードが正しく設定される（既に承認済み）', () => {
      const report = createReport({ status: 'manager_approved' });
      try {
        validateWithdraw(report, 1);
      } catch (e) {
        expect(e).toBeInstanceOf(ReportStatusError);
        expect((e as ReportStatusError).code).toBe(
          ReportStatusErrorCode.ALREADY_APPROVED
        );
      }
    });
  });

  describe('isValidTransition', () => {
    it('draft -> submitted は有効', () => {
      expect(isValidTransition('draft', 'submitted')).toBe(true);
    });

    it('submitted -> draft は有効（取り下げ）', () => {
      expect(isValidTransition('submitted', 'draft')).toBe(true);
    });

    it('submitted -> manager_approved は有効', () => {
      expect(isValidTransition('submitted', 'manager_approved')).toBe(true);
    });

    it('submitted -> rejected は有効', () => {
      expect(isValidTransition('submitted', 'rejected')).toBe(true);
    });

    it('manager_approved -> approved は有効', () => {
      expect(isValidTransition('manager_approved', 'approved')).toBe(true);
    });

    it('manager_approved -> rejected は有効', () => {
      expect(isValidTransition('manager_approved', 'rejected')).toBe(true);
    });

    it('rejected -> submitted は有効（再提出）', () => {
      expect(isValidTransition('rejected', 'submitted')).toBe(true);
    });

    it('draft -> approved は無効', () => {
      expect(isValidTransition('draft', 'approved')).toBe(false);
    });

    it('approved -> draft は無効', () => {
      expect(isValidTransition('approved', 'draft')).toBe(false);
    });

    it('draft -> draft は無効', () => {
      expect(isValidTransition('draft', 'draft')).toBe(false);
    });

    it('approved からは遷移不可', () => {
      expect(isValidTransition('approved', 'draft')).toBe(false);
      expect(isValidTransition('approved', 'submitted')).toBe(false);
      expect(isValidTransition('approved', 'manager_approved')).toBe(false);
      expect(isValidTransition('approved', 'rejected')).toBe(false);
    });
  });

  describe('createSubmitUpdateData', () => {
    it('正しい更新データを生成する', () => {
      const data = createSubmitUpdateData();
      expect(data.status).toBe('submitted');
      expect(data.submittedAt).toBeInstanceOf(Date);
    });
  });

  describe('createWithdrawUpdateData', () => {
    it('正しい更新データを生成する', () => {
      const data = createWithdrawUpdateData();
      expect(data.status).toBe('draft');
      expect(data.submittedAt).toBeNull();
    });
  });
});

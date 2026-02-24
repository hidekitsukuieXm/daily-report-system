/**
 * 日報API テスト
 * ステータス遷移API（提出・取り下げ）のテスト
 */

import { http, HttpResponse } from 'msw';
import { describe, it, expect } from 'vitest';

import { server } from '@/test/mocks/server';

import { submitReport, withdrawReport } from './reports';

const BASE_URL = 'https://api.example.com/api/v1';

describe('Reports API - Status Transitions', () => {
  describe('submitReport', () => {
    it('should submit a draft report successfully', async () => {
      // 提出成功のモックハンドラーを設定
      server.use(
        http.post(`${BASE_URL}/reports/:id/submit`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 1,
              status: 'submitted',
              submitted_at: new Date().toISOString(),
            },
          });
        })
      );

      const result = await submitReport(1);

      expect(result.id).toBe(1);
      expect(result.status).toBe('submitted');
      expect(typeof result.submitted_at).toBe('string');
    });

    it('should return error when report not found', async () => {
      server.use(
        http.post(`${BASE_URL}/reports/:id/submit`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: '日報が見つかりません' },
            },
            { status: 404 }
          );
        })
      );

      await expect(submitReport(9999)).rejects.toThrow();
    });

    it('should return error when status is not submittable', async () => {
      server.use(
        http.post(`${BASE_URL}/reports/:id/submit`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'この状態では提出できません',
              },
            },
            { status: 403 }
          );
        })
      );

      await expect(submitReport(2)).rejects.toThrow();
    });

    it('should return error when no visit records', async () => {
      server.use(
        http.post(`${BASE_URL}/reports/:id/submit`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'NO_VISITS',
                message: '訪問記録を1件以上入力してください',
              },
            },
            { status: 422 }
          );
        })
      );

      await expect(submitReport(3)).rejects.toThrow();
    });
  });

  describe('withdrawReport', () => {
    it('should withdraw a submitted report successfully', async () => {
      server.use(
        http.post(`${BASE_URL}/reports/:id/withdraw`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              id: 1,
              status: 'draft',
            },
          });
        })
      );

      const result = await withdrawReport(1);

      expect(result).toEqual({
        id: 1,
        status: 'draft',
      });
    });

    it('should return error when report not found', async () => {
      server.use(
        http.post(`${BASE_URL}/reports/:id/withdraw`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: '日報が見つかりません' },
            },
            { status: 404 }
          );
        })
      );

      await expect(withdrawReport(9999)).rejects.toThrow();
    });

    it('should return error when status is not withdrawable', async () => {
      server.use(
        http.post(`${BASE_URL}/reports/:id/withdraw`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'この状態では取り下げできません',
              },
            },
            { status: 403 }
          );
        })
      );

      await expect(withdrawReport(2)).rejects.toThrow();
    });

    it('should not allow withdrawal of approved reports', async () => {
      server.use(
        http.post(`${BASE_URL}/reports/:id/withdraw`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'この状態では取り下げできません',
              },
            },
            { status: 403 }
          );
        })
      );

      // approved 状態の日報は取り下げ不可
      await expect(withdrawReport(2)).rejects.toThrow();
    });

    it('should not allow withdrawal of manager_approved reports', async () => {
      server.use(
        http.post(`${BASE_URL}/reports/:id/withdraw`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'この状態では取り下げできません',
              },
            },
            { status: 403 }
          );
        })
      );

      // manager_approved 状態の日報は取り下げ不可
      await expect(withdrawReport(4)).rejects.toThrow();
    });
  });
});

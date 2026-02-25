/**
 * マスタAPI テスト
 * setup.tsで設定されるMSWサーバーを使用
 */

import { describe, it, expect } from 'vitest';

import { getPositions, getIndustries, getVisitResults } from './masters';

describe('マスタAPI', () => {
  describe('getPositions', () => {
    it('役職一覧を取得できること', async () => {
      const positions = await getPositions();

      expect(positions).toHaveLength(3);
      expect(positions[0]).toEqual({ id: 1, name: '担当', level: 1 });
      expect(positions[1]).toEqual({ id: 2, name: '課長', level: 2 });
      expect(positions[2]).toEqual({ id: 3, name: '部長', level: 3 });
    });

    it('役職のid, name, levelが正しい型であること', async () => {
      const positions = await getPositions();

      positions.forEach((position) => {
        expect(typeof position.id).toBe('number');
        expect(typeof position.name).toBe('string');
        expect(typeof position.level).toBe('number');
      });
    });
  });

  describe('getIndustries', () => {
    it('業種一覧を取得できること', async () => {
      const industries = await getIndustries();

      expect(industries).toHaveLength(5);
      expect(industries).toContainEqual({ code: 'manufacturing', name: '製造業' });
      expect(industries).toContainEqual({ code: 'it', name: 'IT・通信' });
      expect(industries).toContainEqual({ code: 'finance', name: '金融・保険' });
      expect(industries).toContainEqual({ code: 'retail', name: '小売・流通' });
      expect(industries).toContainEqual({ code: 'service', name: 'サービス' });
    });

    it('業種のcode, nameが正しい型であること', async () => {
      const industries = await getIndustries();

      industries.forEach((industry) => {
        expect(typeof industry.code).toBe('string');
        expect(typeof industry.name).toBe('string');
      });
    });
  });

  describe('getVisitResults', () => {
    it('訪問結果一覧を取得できること', async () => {
      const visitResults = await getVisitResults();

      expect(visitResults).toHaveLength(5);
      expect(visitResults).toContainEqual({ code: 'negotiating', name: '商談中' });
      expect(visitResults).toContainEqual({ code: 'closed_won', name: '成約' });
      expect(visitResults).toContainEqual({ code: 'closed_lost', name: '見送り' });
      expect(visitResults).toContainEqual({
        code: 'information_gathering',
        name: '情報収集',
      });
      expect(visitResults).toContainEqual({ code: 'other', name: 'その他' });
    });

    it('訪問結果のcode, nameが正しい型であること', async () => {
      const visitResults = await getVisitResults();

      visitResults.forEach((visitResult) => {
        expect(typeof visitResult.code).toBe('string');
        expect(typeof visitResult.name).toBe('string');
      });
    });
  });
});

/**
 * ダッシュボード用カスタムhooks
 */

import { useQuery } from '@tanstack/react-query';

import {
  getDashboardSummary,
  getRecentReports,
  getPendingApprovals,
  type DashboardSummary,
} from '@/lib/api/dashboard';
import type { DailyReportSummary } from '@/schemas/data';

/**
 * ダッシュボードサマリーを取得するhook
 */
export function useDashboardSummary() {
  return useQuery<DashboardSummary, Error>({
    queryKey: ['dashboard', 'summary'],
    queryFn: getDashboardSummary,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });
}

/**
 * 直近の日報を取得するhook
 */
export function useRecentReports() {
  return useQuery<DailyReportSummary[], Error>({
    queryKey: ['dashboard', 'recentReports'],
    queryFn: getRecentReports,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });
}

/**
 * 承認待ち日報を取得するhook
 */
export function usePendingApprovals(enabled: boolean) {
  return useQuery<DailyReportSummary[], Error>({
    queryKey: ['dashboard', 'pendingApprovals'],
    queryFn: getPendingApprovals,
    enabled,
    staleTime: 1000 * 60 * 5, // 5分間キャッシュ
  });
}

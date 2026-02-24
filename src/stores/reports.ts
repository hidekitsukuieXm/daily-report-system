/**
 * 日報ストア
 * Zustandによる日報状態管理
 */

import { create } from 'zustand';

import * as attachmentsApi from '@/lib/api/attachments';
import { extractApiError } from '@/lib/api/client';
import * as reportsApi from '@/lib/api/reports';
import * as visitsApi from '@/lib/api/visits';
import type {
  CreateReportRequest,
  ReportSearchQuery,
  UpdateReportRequest,
  CreateVisitRequest,
  UpdateVisitRequest,
} from '@/schemas/api';
import type {
  DailyReportDetail,
  DailyReportSummary,
  Pagination,
  VisitRecordWithCustomer,
} from '@/schemas/data';

type ReportState = {
  // 一覧状態
  reports: DailyReportSummary[];
  pagination: Pagination | null;
  searchQuery: Partial<ReportSearchQuery>;

  // 詳細状態
  currentReport: DailyReportDetail | null;

  // UI状態
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // 一覧アクション
  fetchReports: (query?: Partial<ReportSearchQuery>) => Promise<void>;
  setSearchQuery: (query: Partial<ReportSearchQuery>) => void;
  clearReports: () => void;

  // 詳細アクション
  fetchReport: (id: number) => Promise<void>;
  createReport: (data: CreateReportRequest) => Promise<DailyReportDetail>;
  updateReport: (
    id: number,
    data: UpdateReportRequest
  ) => Promise<DailyReportDetail>;
  deleteReport: (id: number) => Promise<void>;
  submitReport: (id: number) => Promise<void>;
  clearCurrentReport: () => void;

  // 訪問記録アクション
  addVisit: (
    reportId: number,
    data: CreateVisitRequest
  ) => Promise<VisitRecordWithCustomer>;
  updateVisit: (
    id: number,
    data: UpdateVisitRequest
  ) => Promise<VisitRecordWithCustomer>;
  deleteVisit: (id: number) => Promise<void>;

  // 添付ファイルアクション
  uploadAttachment: (
    visitId: number,
    file: File
  ) => Promise<attachmentsApi.UploadedAttachment>;
  deleteAttachment: (id: number) => Promise<void>;

  // エラーアクション
  clearError: () => void;
};

export const useReportStore = create<ReportState>()((set, get) => ({
  // 初期状態
  reports: [],
  pagination: null,
  searchQuery: {},
  currentReport: null,
  isLoading: false,
  isSubmitting: false,
  error: null,

  // 日報一覧を取得
  fetchReports: async (query?: Partial<ReportSearchQuery>) => {
    set({ isLoading: true, error: null });

    try {
      const mergedQuery = { ...get().searchQuery, ...query };
      const result = await reportsApi.getReports(mergedQuery);

      set({
        reports: result.items,
        pagination: result.pagination,
        searchQuery: mergedQuery,
        isLoading: false,
      });
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isLoading: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 検索条件を設定
  setSearchQuery: (query: Partial<ReportSearchQuery>) => {
    set({ searchQuery: query });
  },

  // 日報一覧をクリア
  clearReports: () => {
    set({
      reports: [],
      pagination: null,
      searchQuery: {},
    });
  },

  // 日報詳細を取得
  fetchReport: async (id: number) => {
    set({ isLoading: true, error: null });

    try {
      const report = await reportsApi.getReport(id);
      set({
        currentReport: report,
        isLoading: false,
      });
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isLoading: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 日報を作成
  createReport: async (data: CreateReportRequest) => {
    set({ isSubmitting: true, error: null });

    try {
      const report = await reportsApi.createReport(data);
      set({
        currentReport: report,
        isSubmitting: false,
      });
      return report;
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isSubmitting: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 日報を更新
  updateReport: async (id: number, data: UpdateReportRequest) => {
    set({ isSubmitting: true, error: null });

    try {
      const report = await reportsApi.updateReport(id, data);
      set({
        currentReport: report,
        isSubmitting: false,
      });
      return report;
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isSubmitting: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 日報を削除
  deleteReport: async (id: number) => {
    set({ isSubmitting: true, error: null });

    try {
      await reportsApi.deleteReport(id);
      // 一覧から削除
      set((state) => ({
        reports: state.reports.filter((r) => r.id !== id),
        currentReport:
          state.currentReport?.id === id ? null : state.currentReport,
        isSubmitting: false,
      }));
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isSubmitting: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 日報を提出
  submitReport: async (id: number) => {
    set({ isSubmitting: true, error: null });

    try {
      await reportsApi.submitReport(id);
      // 詳細を再取得して最新状態を反映
      const report = await reportsApi.getReport(id);
      set({
        currentReport: report,
        isSubmitting: false,
      });
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isSubmitting: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 現在の日報をクリア
  clearCurrentReport: () => {
    set({ currentReport: null, error: null });
  },

  // 訪問記録を追加
  addVisit: async (reportId: number, data: CreateVisitRequest) => {
    set({ isSubmitting: true, error: null });

    try {
      const visit = await visitsApi.createVisit(reportId, data);

      // currentReportの訪問記録を更新
      set((state) => {
        if (state.currentReport && state.currentReport.id === reportId) {
          return {
            currentReport: {
              ...state.currentReport,
              visitRecords: [...state.currentReport.visitRecords, visit],
            },
            isSubmitting: false,
          };
        }
        return { isSubmitting: false };
      });

      return visit;
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isSubmitting: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 訪問記録を更新
  updateVisit: async (id: number, data: UpdateVisitRequest) => {
    set({ isSubmitting: true, error: null });

    try {
      const visit = await visitsApi.updateVisit(id, data);

      // currentReportの訪問記録を更新
      set((state) => {
        if (state.currentReport) {
          return {
            currentReport: {
              ...state.currentReport,
              visitRecords: state.currentReport.visitRecords.map((v) =>
                v.id === id ? visit : v
              ),
            },
            isSubmitting: false,
          };
        }
        return { isSubmitting: false };
      });

      return visit;
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isSubmitting: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 訪問記録を削除
  deleteVisit: async (id: number) => {
    set({ isSubmitting: true, error: null });

    try {
      await visitsApi.deleteVisit(id);

      // currentReportの訪問記録を更新
      set((state) => {
        if (state.currentReport) {
          return {
            currentReport: {
              ...state.currentReport,
              visitRecords: state.currentReport.visitRecords.filter(
                (v) => v.id !== id
              ),
            },
            isSubmitting: false,
          };
        }
        return { isSubmitting: false };
      });
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isSubmitting: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 添付ファイルをアップロード
  uploadAttachment: async (visitId: number, file: File) => {
    set({ isSubmitting: true, error: null });

    try {
      const attachment = await attachmentsApi.uploadAttachment(visitId, file);

      // currentReportの訪問記録の添付ファイルを更新
      set((state) => {
        if (state.currentReport) {
          return {
            currentReport: {
              ...state.currentReport,
              visitRecords: state.currentReport.visitRecords.map((v) => {
                if (v.id === visitId) {
                  return {
                    ...v,
                    attachments: [
                      ...v.attachments,
                      {
                        id: attachment.id,
                        visitRecordId: visitId,
                        fileName: attachment.file_name,
                        filePath: attachment.download_url,
                        contentType: attachment.content_type,
                        fileSize: attachment.file_size,
                        createdAt: new Date(attachment.created_at),
                      },
                    ],
                  };
                }
                return v;
              }),
            },
            isSubmitting: false,
          };
        }
        return { isSubmitting: false };
      });

      return attachment;
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isSubmitting: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // 添付ファイルを削除
  deleteAttachment: async (id: number) => {
    set({ isSubmitting: true, error: null });

    try {
      await attachmentsApi.deleteAttachment(id);

      // currentReportの訪問記録の添付ファイルを更新
      set((state) => {
        if (state.currentReport) {
          return {
            currentReport: {
              ...state.currentReport,
              visitRecords: state.currentReport.visitRecords.map((v) => ({
                ...v,
                attachments: v.attachments.filter((a) => a.id !== id),
              })),
            },
            isSubmitting: false,
          };
        }
        return { isSubmitting: false };
      });
    } catch (error) {
      const apiError = extractApiError(error);
      set({
        isSubmitting: false,
        error: apiError.message,
      });
      throw error;
    }
  },

  // エラーをクリア
  clearError: () => {
    set({ error: null });
  },
}));

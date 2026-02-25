/**
 * 添付ファイルAPI
 */

import { apiClient } from './client';

import type { AxiosResponse } from 'axios';

/**
 * APIレスポンスの型
 */
type ApiResponse<T> = {
  success: true;
  data: T;
};

/**
 * アップロードされた添付ファイル情報
 */
export type UploadedAttachment = {
  id: number;
  file_name: string;
  file_size: number;
  content_type: string;
  download_url: string;
  created_at: string;
};

/**
 * ファイルをアップロード
 */
export async function uploadAttachment(
  visitId: number,
  file: File
): Promise<UploadedAttachment> {
  const formData = new FormData();
  formData.append('file', file);

  const response: AxiosResponse<ApiResponse<UploadedAttachment>> =
    await apiClient.post(`/visits/${visitId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  return response.data.data;
}

/**
 * ファイルをダウンロード
 */
export async function downloadAttachment(id: number): Promise<Blob> {
  const response: AxiosResponse<Blob> = await apiClient.get(
    `/attachments/${id}`,
    {
      responseType: 'blob',
    }
  );
  return response.data;
}

/**
 * ファイルダウンロードURLを取得
 */
export function getAttachmentDownloadUrl(id: number): string {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  const baseUrl = envBaseUrl ?? '/api/v1';
  return `${baseUrl}/attachments/${id}`;
}

/**
 * ファイルを削除
 */
export async function deleteAttachment(id: number): Promise<void> {
  await apiClient.delete(`/attachments/${id}`);
}

/**
 * 添付ファイルの許可されるMIMEタイプ
 */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
] as const;

/**
 * ファイルサイズ上限（10MB）
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * ファイルのバリデーション
 */
export function validateAttachment(file: File): {
  valid: boolean;
  error?: string;
} {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'ファイルサイズは10MB以下にしてください',
    };
  }

  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number]
    )
  ) {
    return {
      valid: false,
      error: 'サポートされていないファイル形式です',
    };
  }

  return { valid: true };
}

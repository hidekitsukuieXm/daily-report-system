/**
 * コメントAPI
 */

import type { CreateCommentRequest } from '@/schemas/api';
import type { CommentWithCommenter } from '@/schemas/data';

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
 * コメント一覧レスポンスの型
 */
type CommentsListResponse = {
  items: CommentWithCommenter[];
};

/**
 * コメント一覧を取得
 */
export async function getComments(
  reportId: number
): Promise<CommentWithCommenter[]> {
  const response: AxiosResponse<ApiResponse<CommentsListResponse>> =
    await apiClient.get(`/reports/${reportId}/comments`);
  return response.data.data.items;
}

/**
 * コメントを作成
 */
export async function createComment(
  reportId: number,
  data: CreateCommentRequest
): Promise<CommentWithCommenter> {
  const response: AxiosResponse<ApiResponse<CommentWithCommenter>> =
    await apiClient.post(`/reports/${reportId}/comments`, data);
  return response.data.data;
}

/**
 * コメントを削除
 */
export async function deleteComment(commentId: number): Promise<void> {
  await apiClient.delete(`/comments/${commentId}`);
}

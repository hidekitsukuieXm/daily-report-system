/**
 * 認証API
 */

import type { LoginRequest, LoginResponse } from '@/schemas/api';

import { apiClient } from './client';

type ApiResponse<T> = {
  success: true;
  data: T;
};

/**
 * ログイン
 */
export async function login(
  request: LoginRequest
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/login',
    request
  );
  return response.data;
}

/**
 * ログアウト
 */
export async function logout(): Promise<ApiResponse<{ message: string }>> {
  const response =
    await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
  return response.data;
}

/**
 * トークンリフレッシュ
 */
export async function refreshToken(
  token: string
): Promise<ApiResponse<LoginResponse>> {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    '/auth/refresh',
    { refresh_token: token }
  );
  return response.data;
}

/**
 * 現在のユーザー情報取得
 */
export async function getCurrentUser(): Promise<
  ApiResponse<LoginResponse['user']>
> {
  const response =
    await apiClient.get<ApiResponse<LoginResponse['user']>>('/auth/me');
  return response.data;
}

/**
 * パスワード変更
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ApiResponse<{ message: string }>> {
  const response = await apiClient.put<ApiResponse<{ message: string }>>(
    '/auth/password',
    {
      current_password: currentPassword,
      new_password: newPassword,
    }
  );
  return response.data;
}

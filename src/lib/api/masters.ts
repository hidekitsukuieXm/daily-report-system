/**
 * マスタAPI
 */

import { apiClient } from './client';

type ApiResponse<T> = {
  success: true;
  data: T;
};

/**
 * 役職マスタ型
 */
export type PositionMaster = {
  id: number;
  name: string;
  level: number;
};

/**
 * マスタリストレスポンス型
 */
export type MasterListResponse<T> = {
  items: T[];
};

/**
 * 役職一覧を取得
 */
export async function getPositions(): Promise<PositionMaster[]> {
  const response =
    await apiClient.get<ApiResponse<MasterListResponse<PositionMaster>>>(
      '/positions'
    );
  return response.data.data.items;
}

/**
 * 上長候補（課長）一覧を取得
 */
export async function getManagers(): Promise<{ id: number; name: string }[]> {
  const response = await apiClient.get<
    ApiResponse<MasterListResponse<{ id: number; name: string }>>
  >('/salespersons', {
    params: {
      position_id: 2, // 課長
      is_active: 'true',
    },
  });
  return response.data.data.items;
}

/**
 * 上長候補（部長）一覧を取得
 */
export async function getDirectors(): Promise<{ id: number; name: string }[]> {
  const response = await apiClient.get<
    ApiResponse<MasterListResponse<{ id: number; name: string }>>
  >('/salespersons', {
    params: {
      position_id: 3, // 部長
      is_active: 'true',
    },
  });
  return response.data.data.items;
}

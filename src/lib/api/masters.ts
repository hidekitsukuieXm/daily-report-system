/**
 * マスタAPI
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
 * 役職
 */
export type PositionMaster = {
  id: number;
  name: string;
  level: number;
};

/**
 * マスタリストレスポンス
 */
type MasterListResponse<T> = {
  items: T[];
};

/**
 * 役職一覧を取得
 */
export async function getPositions(): Promise<PositionMaster[]> {
  const response: AxiosResponse<
    ApiResponse<MasterListResponse<PositionMaster>>
  > = await apiClient.get('/positions');
  return response.data.data.items;
}

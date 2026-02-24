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
 * 業種
 */
export type IndustryMaster = {
  code: string;
  name: string;
};

/**
 * 訪問結果
 */
export type VisitResultMaster = {
  code: string;
  name: string;
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

/**
 * 業種一覧を取得
 */
export async function getIndustries(): Promise<IndustryMaster[]> {
  const response: AxiosResponse<
    ApiResponse<MasterListResponse<IndustryMaster>>
  > = await apiClient.get('/industries');
  return response.data.data.items;
}

/**
 * 訪問結果一覧を取得
 */
export async function getVisitResults(): Promise<VisitResultMaster[]> {
  const response: AxiosResponse<
    ApiResponse<MasterListResponse<VisitResultMaster>>
  > = await apiClient.get('/visit-results');
  return response.data.data.items;
}

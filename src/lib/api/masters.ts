/**
 * マスタAPI
 * 業種・訪問結果などのマスタデータ取得
 */

import { apiClient, extractApiError } from './client';

export type IndustryMaster = {
  value: string;
  label: string;
};

type IndustryListResponse = {
  success: boolean;
  data: IndustryMaster[];
};

/**
 * 業種一覧を取得
 */
export async function getIndustries(): Promise<IndustryMaster[]> {
  try {
    const response = await apiClient.get<IndustryListResponse>('/industries');
    return response.data.data;
  } catch (error) {
    const apiError = extractApiError(error);
    throw new Error(apiError.message);
  }
}

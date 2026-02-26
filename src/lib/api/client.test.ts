/**
 * APIクライアントのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { apiClient, extractApiError } from './client';
import { useAuthStore } from '@/stores/auth';

describe('extractApiError', () => {
  it('should extract error from API error response', () => {
    const error = {
      response: {
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '入力値が不正です',
          },
        },
      },
      isAxiosError: true,
    };

    // Make it look like an Axios error
    Object.defineProperty(error, 'isAxiosError', { value: true });

    const result = extractApiError(error);

    expect(result.code).toBe('VALIDATION_ERROR');
    expect(result.message).toBe('入力値が不正です');
  });

  it('should return network error for Axios errors without response data', () => {
    const error = new Error('Network Error');
    Object.defineProperty(error, 'isAxiosError', { value: true });

    const result = extractApiError(error);

    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.message).toBe('Network Error');
  });

  it('should return default network error message when error message is empty', () => {
    const error = new Error('');
    Object.defineProperty(error, 'isAxiosError', { value: true });

    const result = extractApiError(error);

    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.message).toBe('ネットワークエラーが発生しました');
  });

  it('should return unknown error for non-Axios errors', () => {
    const error = new Error('Something went wrong');

    const result = extractApiError(error);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('予期しないエラーが発生しました');
  });

  it('should handle non-Error objects', () => {
    const error = 'string error';

    const result = extractApiError(error);

    expect(result.code).toBe('UNKNOWN_ERROR');
    expect(result.message).toBe('予期しないエラーが発生しました');
  });
});

describe('apiClient configuration', () => {
  beforeEach(() => {
    // ストアをリセット
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('should be defined', () => {
    expect(apiClient).toBeDefined();
  });

  it('should have interceptors configured', () => {
    expect(apiClient.interceptors).toBeDefined();
    expect(apiClient.interceptors.request).toBeDefined();
    expect(apiClient.interceptors.response).toBeDefined();
  });
});

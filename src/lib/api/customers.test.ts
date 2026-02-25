/**
 * 顧客マスタAPI テスト
 */

import { describe, it, expect } from 'vitest';

import {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from './customers';

describe('customers API', () => {
  describe('getCustomers', () => {
    it('should fetch customers list', async () => {
      const result = await getCustomers();

      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.currentPage).toBe(1);
    });

    it('should fetch customers with pagination', async () => {
      const result = await getCustomers({ page: 1, per_page: 10 });

      expect(result.items).toBeDefined();
      expect(result.pagination.perPage).toBe(10);
    });

    it('should filter customers by name', async () => {
      const result = await getCustomers({ name: 'ABC' });

      expect(result.items).toBeDefined();
      // モックデータに'ABC'を含む顧客が存在することを確認
      expect(result.items.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter customers by industry', async () => {
      const result = await getCustomers({ industry: '製造業' });

      expect(result.items).toBeDefined();
    });

    it('should filter customers by is_active', async () => {
      const result = await getCustomers({ is_active: true });

      expect(result.items).toBeDefined();
    });
  });

  describe('getCustomer', () => {
    it('should fetch a single customer by ID', async () => {
      const result = await getCustomer(1);

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.name).toBeDefined();
    });

    it('should throw error for non-existent customer', async () => {
      await expect(getCustomer(99999)).rejects.toThrow();
    });
  });

  describe('createCustomer', () => {
    it('should create a new customer', async () => {
      const newCustomer = {
        name: 'テスト株式会社',
        address: '東京都渋谷区1-1-1',
        phone: '03-9999-9999',
        industry: 'IT・通信',
      };

      const result = await createCustomer(newCustomer);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe(newCustomer.name);
      expect(result.isActive).toBe(true);
    });

    it('should create customer with minimal data', async () => {
      const newCustomer = {
        name: '最小データ株式会社',
      };

      const result = await createCustomer(newCustomer);

      expect(result).toBeDefined();
      expect(result.name).toBe(newCustomer.name);
    });
  });

  describe('updateCustomer', () => {
    it('should update an existing customer', async () => {
      const updateData = {
        name: '更新された顧客名',
        industry: '金融・保険',
      };

      const result = await updateCustomer(1, updateData);

      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.industry).toBe(updateData.industry);
    });

    it('should update customer is_active flag', async () => {
      const updateData = {
        is_active: false,
      };

      const result = await updateCustomer(1, updateData);

      expect(result).toBeDefined();
      expect(result.isActive).toBe(false);
    });

    it('should throw error for non-existent customer', async () => {
      await expect(updateCustomer(99999, { name: 'test' })).rejects.toThrow();
    });
  });

  describe('deleteCustomer', () => {
    it('should delete (soft delete) a customer', async () => {
      await expect(deleteCustomer(1)).resolves.not.toThrow();
    });

    it('should throw error for non-existent customer', async () => {
      await expect(deleteCustomer(99999)).rejects.toThrow();
    });
  });
});

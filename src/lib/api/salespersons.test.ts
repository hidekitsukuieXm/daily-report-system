/**
 * 営業担当者APIのテスト
 */

import { http, HttpResponse } from 'msw';
import { describe, it, expect, beforeEach } from 'vitest';

import { server } from '@/test/mocks/server';

import {
  getSalespersons,
  getSalesperson,
  createSalesperson,
  updateSalesperson,
  deleteSalesperson,
  getSalespersonPositions,
  getManagers,
  getDirectors,
} from './salespersons';

const BASE_URL = 'https://api.example.com/api/v1';

describe('salespersons API', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('getSalespersons', () => {
    it('should fetch salespersons list', async () => {
      const result = await getSalespersons();

      expect(result.items).toBeDefined();
      expect(result.pagination).toBeDefined();
      expect(result.items.length).toBeGreaterThan(0);
    });

    it('should filter salespersons by name', async () => {
      const result = await getSalespersons({ name: '山田' });

      expect(result.items).toBeDefined();
    });

    it('should filter salespersons by position', async () => {
      const result = await getSalespersons({ position_id: 1 });

      expect(result.items).toBeDefined();
    });

    it('should filter salespersons by active status', async () => {
      const result = await getSalespersons({ is_active: true });

      expect(result.items).toBeDefined();
      result.items.forEach((person) => {
        expect(person.isActive).toBe(true);
      });
    });
  });

  describe('getSalesperson', () => {
    it('should fetch a single salesperson', async () => {
      const result = await getSalesperson(1);

      expect(result.id).toBe(1);
      expect(result.name).toBeDefined();
      expect(result.position).toBeDefined();
    });

    it('should handle not found error', async () => {
      server.use(
        http.get(`${BASE_URL}/salespersons/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'NOT_FOUND',
                message: '営業担当者が見つかりません',
              },
            },
            { status: 404 }
          );
        })
      );

      await expect(getSalesperson(999)).rejects.toThrow();
    });
  });

  describe('createSalesperson', () => {
    it('should create a new salesperson', async () => {
      const newPerson = {
        name: '新規担当者',
        email: 'newperson@example.com',
        position_id: 1,
        manager_id: null,
        director_id: null,
        password: 'password123',
      };

      const result = await createSalesperson(newPerson);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(newPerson.name);
    });

    it('should handle duplicate email error', async () => {
      server.use(
        http.post(`${BASE_URL}/salespersons`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: {
                code: 'DUPLICATE_EMAIL',
                message: 'このメールアドレスは既に登録されています',
              },
            },
            { status: 409 }
          );
        })
      );

      const newPerson = {
        name: '新規担当者',
        email: 'existing@example.com',
        position_id: 1,
        password: 'password123',
      };

      await expect(createSalesperson(newPerson)).rejects.toThrow();
    });
  });

  describe('updateSalesperson', () => {
    it('should update a salesperson', async () => {
      const updateData = {
        name: '更新された名前',
        is_active: false,
      };

      const result = await updateSalesperson(1, updateData);

      expect(result.id).toBe(1);
    });
  });

  describe('deleteSalesperson', () => {
    it('should delete a salesperson', async () => {
      await expect(deleteSalesperson(1)).resolves.toBeUndefined();
    });
  });

  describe('getSalespersonPositions', () => {
    it('should fetch positions list', async () => {
      const result = await getSalespersonPositions();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('level');
    });
  });

  describe('getManagers', () => {
    it('should fetch managers list', async () => {
      const result = await getManagers();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getDirectors', () => {
    it('should fetch directors list', async () => {
      const result = await getDirectors();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});

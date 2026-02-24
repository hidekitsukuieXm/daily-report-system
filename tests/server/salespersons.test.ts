/**
 * 営業担当者マスタAPI テスト
 */
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/server/index';
import { mockPrisma, mockDirector, mockManager, mockStaff } from './setup';

describe('営業担当者マスタAPI', () => {
  // テスト用データ
  const mockPosition = {
    id: 1,
    name: '担当',
    level: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSalesperson = {
    id: 1,
    name: '山田太郎',
    email: 'yamada@example.com',
    password: 'hashed_password',
    positionId: 1,
    managerId: 2,
    directorId: 3,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    position: mockPosition,
    manager: { id: 2, name: '鈴木課長' },
    director: { id: 3, name: '田中部長' },
  };

  describe('GET /api/v1/salespersons', () => {
    it('認証なしでアクセスすると401エラー', async () => {
      const res = await request(app).get('/api/v1/salespersons');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('営業担当者一覧を取得できる', async () => {
      mockPrisma.salesperson.findMany.mockResolvedValue([mockSalesperson]);
      mockPrisma.salesperson.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/salespersons')
        .set('Authorization', 'Bearer director_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.items).toHaveLength(1);
      expect(res.body.data.items[0].name).toBe('山田太郎');
      expect(res.body.data.pagination.total_count).toBe(1);
    });

    it('ページネーションが正しく動作する', async () => {
      mockPrisma.salesperson.findMany.mockResolvedValue([mockSalesperson]);
      mockPrisma.salesperson.count.mockResolvedValue(50);

      const res = await request(app)
        .get('/api/v1/salespersons?page=2&per_page=10')
        .set('Authorization', 'Bearer director_token');

      expect(res.status).toBe(200);
      expect(res.body.data.pagination.current_page).toBe(2);
      expect(res.body.data.pagination.per_page).toBe(10);
      expect(res.body.data.pagination.total_pages).toBe(5);
    });

    it('役職IDでフィルタできる', async () => {
      mockPrisma.salesperson.findMany.mockResolvedValue([mockSalesperson]);
      mockPrisma.salesperson.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/salespersons?position_id=1')
        .set('Authorization', 'Bearer director_token');

      expect(res.status).toBe(200);
      expect(mockPrisma.salesperson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ positionId: 1 }),
        })
      );
    });

    it('有効フラグでフィルタできる', async () => {
      mockPrisma.salesperson.findMany.mockResolvedValue([mockSalesperson]);
      mockPrisma.salesperson.count.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/v1/salespersons?is_active=true')
        .set('Authorization', 'Bearer director_token');

      expect(res.status).toBe(200);
      expect(mockPrisma.salesperson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });
  });

  describe('GET /api/v1/salespersons/:id', () => {
    it('営業担当者詳細を取得できる', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(mockSalesperson);

      const res = await request(app)
        .get('/api/v1/salespersons/1')
        .set('Authorization', 'Bearer director_token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(1);
      expect(res.body.data.name).toBe('山田太郎');
      expect(res.body.data.manager).toEqual({ id: 2, name: '鈴木課長' });
      expect(res.body.data.director).toEqual({ id: 3, name: '田中部長' });
    });

    it('存在しないIDで404エラー', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/salespersons/999')
        .set('Authorization', 'Bearer director_token');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('無効なIDで400エラー', async () => {
      const res = await request(app)
        .get('/api/v1/salespersons/abc')
        .set('Authorization', 'Bearer director_token');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/salespersons', () => {
    const validCreateData = {
      name: '新規担当者',
      email: 'new@example.com',
      password: 'Password123',
      position_id: 1,
      manager_id: 2,
      director_id: 3,
    };

    it('部長権限で営業担当者を作成できる', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(null); // メール重複なし
      mockPrisma.position.findUnique.mockResolvedValue(mockPosition);
      mockPrisma.salesperson.create.mockResolvedValue({
        ...mockSalesperson,
        id: 10,
        name: validCreateData.name,
        email: validCreateData.email,
      });
      // manager/director存在チェック用
      mockPrisma.salesperson.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce({ id: 2 }) // manager check
        .mockResolvedValueOnce({ id: 3 }); // director check

      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer director_token')
        .send(validCreateData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('新規担当者');
    });

    it('課長権限では作成できない（403エラー）', async () => {
      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer manager_token')
        .send(validCreateData);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('担当者権限では作成できない（403エラー）', async () => {
      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer staff_token')
        .send(validCreateData);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('メール重複で409エラー', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(mockSalesperson); // メール重複

      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer director_token')
        .send(validCreateData);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    });

    it('氏名が空で422エラー', async () => {
      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer director_token')
        .send({ ...validCreateData, name: '' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('氏名が50文字超で422エラー', async () => {
      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer director_token')
        .send({ ...validCreateData, name: 'a'.repeat(51) });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('無効なメール形式で422エラー', async () => {
      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer director_token')
        .send({ ...validCreateData, email: 'invalid-email' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('パスワード8文字未満で422エラー', async () => {
      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer director_token')
        .send({ ...validCreateData, password: 'Pass1' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('パスワードが英数字混在でない場合422エラー', async () => {
      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer director_token')
        .send({ ...validCreateData, password: 'onlyletters' });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('存在しない役職IDで422エラー', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(null); // メール重複なし
      mockPrisma.position.findUnique.mockResolvedValue(null); // 役職なし

      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer director_token')
        .send(validCreateData);

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('役職');
    });

    it('存在しないmanager_idで422エラー', async () => {
      mockPrisma.salesperson.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // manager check
      mockPrisma.position.findUnique.mockResolvedValue(mockPosition);

      const res = await request(app)
        .post('/api/v1/salespersons')
        .set('Authorization', 'Bearer director_token')
        .send(validCreateData);

      expect(res.status).toBe(422);
      expect(res.body.error.message).toContain('課長');
    });
  });

  describe('PUT /api/v1/salespersons/:id', () => {
    it('部長権限で営業担当者を更新できる', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(mockSalesperson);
      mockPrisma.salesperson.update.mockResolvedValue({
        ...mockSalesperson,
        name: '更新後名前',
      });

      const res = await request(app)
        .put('/api/v1/salespersons/1')
        .set('Authorization', 'Bearer director_token')
        .send({ name: '更新後名前' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('更新後名前');
    });

    it('課長権限では更新できない（403エラー）', async () => {
      const res = await request(app)
        .put('/api/v1/salespersons/1')
        .set('Authorization', 'Bearer manager_token')
        .send({ name: '更新後名前' });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('存在しないIDで404エラー', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/v1/salespersons/999')
        .set('Authorization', 'Bearer director_token')
        .send({ name: '更新後名前' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('メール重複（他のユーザー）で409エラー', async () => {
      mockPrisma.salesperson.findUnique
        .mockResolvedValueOnce(mockSalesperson) // 既存データ取得
        .mockResolvedValueOnce({ ...mockSalesperson, id: 99 }); // メール重複チェック

      const res = await request(app)
        .put('/api/v1/salespersons/1')
        .set('Authorization', 'Bearer director_token')
        .send({ email: 'other@example.com' });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
    });

    it('is_activeをfalseに更新できる', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(mockSalesperson);
      mockPrisma.salesperson.update.mockResolvedValue({
        ...mockSalesperson,
        isActive: false,
      });

      const res = await request(app)
        .put('/api/v1/salespersons/1')
        .set('Authorization', 'Bearer director_token')
        .send({ is_active: false });

      expect(res.status).toBe(200);
      expect(res.body.data.is_active).toBe(false);
    });

    it('パスワードを更新できる', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(mockSalesperson);
      mockPrisma.salesperson.update.mockResolvedValue(mockSalesperson);

      const res = await request(app)
        .put('/api/v1/salespersons/1')
        .set('Authorization', 'Bearer director_token')
        .send({ password: 'NewPassword123' });

      expect(res.status).toBe(200);
      expect(mockPrisma.salesperson.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ password: 'hashed_password' }),
        })
      );
    });
  });

  describe('DELETE /api/v1/salespersons/:id', () => {
    it('部長権限で営業担当者を論理削除できる', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(mockSalesperson);
      mockPrisma.salesperson.update.mockResolvedValue({
        ...mockSalesperson,
        isActive: false,
      });

      const res = await request(app)
        .delete('/api/v1/salespersons/1')
        .set('Authorization', 'Bearer director_token');

      expect(res.status).toBe(204);
      expect(mockPrisma.salesperson.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { isActive: false },
      });
    });

    it('課長権限では削除できない（403エラー）', async () => {
      const res = await request(app)
        .delete('/api/v1/salespersons/1')
        .set('Authorization', 'Bearer manager_token');

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('存在しないIDで404エラー', async () => {
      mockPrisma.salesperson.findUnique.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/v1/salespersons/999')
        .set('Authorization', 'Bearer director_token');

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('無効なIDで400エラー', async () => {
      const res = await request(app)
        .delete('/api/v1/salespersons/abc')
        .set('Authorization', 'Bearer director_token');

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});

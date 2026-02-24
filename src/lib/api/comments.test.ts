/**
 * コメントAPIのテスト
 */

import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@/test/mocks/server';

import { createComment, deleteComment, getComments } from './comments';

const BASE_URL = 'https://api.example.com/api/v1';

describe('Comments API', () => {
  describe('getComments', () => {
    it('日報のコメント一覧を取得できる', async () => {
      const comments = await getComments(1);

      expect(comments).toBeInstanceOf(Array);
      expect(comments.length).toBeGreaterThan(0);

      const firstComment = comments[0];
      expect(firstComment).toBeDefined();
      expect(firstComment).toHaveProperty('id');
      expect(firstComment).toHaveProperty('content');
      expect(firstComment).toHaveProperty('commenter');
      expect(firstComment?.commenter).toHaveProperty('id');
      expect(firstComment?.commenter).toHaveProperty('name');
      expect(firstComment?.commenter).toHaveProperty('position');
    });

    it('存在しない日報IDでも空配列を返す', async () => {
      server.use(
        http.get(`${BASE_URL}/reports/:reportId/comments`, () => {
          return HttpResponse.json({
            success: true,
            data: { items: [] },
          });
        })
      );

      const comments = await getComments(999);
      expect(comments).toEqual([]);
    });
  });

  describe('createComment', () => {
    it('コメントを作成できる', async () => {
      const newComment = await createComment(1, {
        content: 'テストコメント',
      });

      expect(newComment).toHaveProperty('id');
      expect(newComment.content).toBe('テストコメント');
      expect(newComment).toHaveProperty('createdAt');
      expect(newComment).toHaveProperty('commenter');
    });

    it('空のコンテンツでバリデーションエラーになる', async () => {
      await expect(
        createComment(1, { content: '' })
      ).rejects.toMatchObject({
        response: {
          status: 422,
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'コメントを入力してください',
            },
          },
        },
      });
    });

    it('2000文字を超えるコンテンツでバリデーションエラーになる', async () => {
      const longContent = 'a'.repeat(2001);

      await expect(
        createComment(1, { content: longContent })
      ).rejects.toMatchObject({
        response: {
          status: 422,
          data: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'コメントは2000文字以内で入力してください',
            },
          },
        },
      });
    });
  });

  describe('deleteComment', () => {
    it('コメントを削除できる', async () => {
      await expect(deleteComment(1)).resolves.toBeUndefined();
    });

    it('存在しないコメントIDで404エラーになる', async () => {
      server.use(
        http.delete(`${BASE_URL}/comments/:id`, () => {
          return HttpResponse.json(
            {
              success: false,
              error: { code: 'NOT_FOUND', message: 'コメントが見つかりません' },
            },
            { status: 404 }
          );
        })
      );

      await expect(deleteComment(999)).rejects.toMatchObject({
        response: {
          status: 404,
        },
      });
    });
  });
});

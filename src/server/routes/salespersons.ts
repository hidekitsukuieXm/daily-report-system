/**
 * 営業担当者マスタAPI
 */
import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// 認証必須
router.use(requireAuth);

// バリデーションスキーマ
const createSalespersonSchema = z.object({
  name: z
    .string()
    .min(1, '氏名を入力してください')
    .max(50, '氏名は50文字以内で入力してください'),
  email: z
    .string()
    .email('有効なメールアドレスを入力してください')
    .max(255),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .max(100)
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      'パスワードは英字と数字を含める必要があります'
    ),
  position_id: z.number().int().positive('役職を選択してください'),
  manager_id: z.number().int().positive().optional().nullable(),
  director_id: z.number().int().positive().optional().nullable(),
});

const updateSalespersonSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  email: z.string().email().max(255).optional(),
  password: z
    .string()
    .min(8)
    .max(100)
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/)
    .optional(),
  position_id: z.number().int().positive().optional(),
  manager_id: z.number().int().positive().optional().nullable(),
  director_id: z.number().int().positive().optional().nullable(),
  is_active: z.boolean().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(20),
  position_id: z.coerce.number().int().positive().optional(),
  is_active: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

/**
 * 部長権限チェック
 */
function requireDirector(req: Request, res: Response): boolean {
  if (!req.user || req.user.positionLevel < 3) {
    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: '権限がありません',
      },
    });
    return false;
  }
  return true;
}

/**
 * GET /salespersons
 * 営業担当者一覧取得
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = querySchema.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: query.error.errors[0].message,
        },
      });
      return;
    }

    const { page, per_page, position_id, is_active } = query.data;
    const skip = (page - 1) * per_page;

    // フィルタ条件
    const where: {
      positionId?: number;
      isActive?: boolean;
    } = {};

    if (position_id !== undefined) {
      where.positionId = position_id;
    }
    if (is_active !== undefined) {
      where.isActive = is_active;
    }

    // データ取得
    const [salespersons, totalCount] = await Promise.all([
      prisma.salesperson.findMany({
        where,
        skip,
        take: per_page,
        orderBy: { id: 'asc' },
        include: {
          position: true,
        },
      }),
      prisma.salesperson.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / per_page);

    res.json({
      success: true,
      data: {
        items: salespersons.map((sp) => ({
          id: sp.id,
          name: sp.name,
          email: sp.email,
          position: {
            id: sp.position.id,
            name: sp.position.name,
            level: sp.position.level,
          },
          is_active: sp.isActive,
          created_at: sp.createdAt.toISOString(),
          updated_at: sp.updatedAt.toISOString(),
        })),
        pagination: {
          current_page: page,
          per_page,
          total_pages: totalPages,
          total_count: totalCount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching salespersons:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

/**
 * GET /salespersons/:id
 * 営業担当者詳細取得
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効なIDです',
        },
      });
      return;
    }

    const salesperson = await prisma.salesperson.findUnique({
      where: { id },
      include: {
        position: true,
        manager: {
          select: { id: true, name: true },
        },
        director: {
          select: { id: true, name: true },
        },
      },
    });

    if (!salesperson) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '営業担当者が見つかりません',
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: salesperson.id,
        name: salesperson.name,
        email: salesperson.email,
        position: {
          id: salesperson.position.id,
          name: salesperson.position.name,
          level: salesperson.position.level,
        },
        manager: salesperson.manager
          ? { id: salesperson.manager.id, name: salesperson.manager.name }
          : null,
        director: salesperson.director
          ? { id: salesperson.director.id, name: salesperson.director.name }
          : null,
        is_active: salesperson.isActive,
        created_at: salesperson.createdAt.toISOString(),
        updated_at: salesperson.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching salesperson:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

/**
 * POST /salespersons
 * 営業担当者新規作成
 */
router.post('/', async (req: Request, res: Response) => {
  if (!requireDirector(req, res)) return;

  try {
    const body = createSalespersonSchema.safeParse(req.body);
    if (!body.success) {
      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: body.error.errors[0].message,
        },
      });
      return;
    }

    const { name, email, password, position_id, manager_id, director_id } =
      body.data;

    // メール重複チェック
    const existingEmail = await prisma.salesperson.findUnique({
      where: { email },
    });
    if (existingEmail) {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_EMAIL',
          message: 'このメールアドレスは既に登録されています',
        },
      });
      return;
    }

    // 役職存在チェック
    const position = await prisma.position.findUnique({
      where: { id: position_id },
    });
    if (!position) {
      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '指定された役職が存在しません',
        },
      });
      return;
    }

    // manager_id存在チェック
    if (manager_id) {
      const manager = await prisma.salesperson.findUnique({
        where: { id: manager_id },
      });
      if (!manager) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '指定された課長が存在しません',
          },
        });
        return;
      }
    }

    // director_id存在チェック
    if (director_id) {
      const director = await prisma.salesperson.findUnique({
        where: { id: director_id },
      });
      if (!director) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '指定された部長が存在しません',
          },
        });
        return;
      }
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // 作成
    const salesperson = await prisma.salesperson.create({
      data: {
        name,
        email,
        password: hashedPassword,
        positionId: position_id,
        managerId: manager_id ?? null,
        directorId: director_id ?? null,
      },
      include: {
        position: true,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        id: salesperson.id,
        name: salesperson.name,
        email: salesperson.email,
        position: {
          id: salesperson.position.id,
          name: salesperson.position.name,
          level: salesperson.position.level,
        },
        is_active: salesperson.isActive,
        created_at: salesperson.createdAt.toISOString(),
        updated_at: salesperson.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating salesperson:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

/**
 * PUT /salespersons/:id
 * 営業担当者更新
 */
router.put('/:id', async (req: Request, res: Response) => {
  if (!requireDirector(req, res)) return;

  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効なIDです',
        },
      });
      return;
    }

    const body = updateSalespersonSchema.safeParse(req.body);
    if (!body.success) {
      res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: body.error.errors[0].message,
        },
      });
      return;
    }

    // 既存データ確認
    const existing = await prisma.salesperson.findUnique({
      where: { id },
    });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '営業担当者が見つかりません',
        },
      });
      return;
    }

    const { name, email, password, position_id, manager_id, director_id, is_active } =
      body.data;

    // メール重複チェック（自分以外）
    if (email && email !== existing.email) {
      const existingEmail = await prisma.salesperson.findUnique({
        where: { email },
      });
      if (existingEmail) {
        res.status(409).json({
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'このメールアドレスは既に登録されています',
          },
        });
        return;
      }
    }

    // 役職存在チェック
    if (position_id) {
      const position = await prisma.position.findUnique({
        where: { id: position_id },
      });
      if (!position) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '指定された役職が存在しません',
          },
        });
        return;
      }
    }

    // manager_id存在チェック
    if (manager_id !== undefined && manager_id !== null) {
      const manager = await prisma.salesperson.findUnique({
        where: { id: manager_id },
      });
      if (!manager) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '指定された課長が存在しません',
          },
        });
        return;
      }
    }

    // director_id存在チェック
    if (director_id !== undefined && director_id !== null) {
      const director = await prisma.salesperson.findUnique({
        where: { id: director_id },
      });
      if (!director) {
        res.status(422).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '指定された部長が存在しません',
          },
        });
        return;
      }
    }

    // 更新データ構築
    const updateData: {
      name?: string;
      email?: string;
      password?: string;
      positionId?: number;
      managerId?: number | null;
      directorId?: number | null;
      isActive?: boolean;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) {
      updateData.password = await bcrypt.hash(password, 10);
    }
    if (position_id !== undefined) updateData.positionId = position_id;
    if (manager_id !== undefined) updateData.managerId = manager_id;
    if (director_id !== undefined) updateData.directorId = director_id;
    if (is_active !== undefined) updateData.isActive = is_active;

    // 更新
    const salesperson = await prisma.salesperson.update({
      where: { id },
      data: updateData,
      include: {
        position: true,
        manager: {
          select: { id: true, name: true },
        },
        director: {
          select: { id: true, name: true },
        },
      },
    });

    res.json({
      success: true,
      data: {
        id: salesperson.id,
        name: salesperson.name,
        email: salesperson.email,
        position: {
          id: salesperson.position.id,
          name: salesperson.position.name,
          level: salesperson.position.level,
        },
        manager: salesperson.manager
          ? { id: salesperson.manager.id, name: salesperson.manager.name }
          : null,
        director: salesperson.director
          ? { id: salesperson.director.id, name: salesperson.director.name }
          : null,
        is_active: salesperson.isActive,
        created_at: salesperson.createdAt.toISOString(),
        updated_at: salesperson.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating salesperson:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

/**
 * DELETE /salespersons/:id
 * 営業担当者削除（論理削除）
 */
router.delete('/:id', async (req: Request, res: Response) => {
  if (!requireDirector(req, res)) return;

  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '無効なIDです',
        },
      });
      return;
    }

    // 既存データ確認
    const existing = await prisma.salesperson.findUnique({
      where: { id },
    });
    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '営業担当者が見つかりません',
        },
      });
      return;
    }

    // 論理削除（is_active = false）
    await prisma.salesperson.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting salesperson:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    });
  }
});

export default router;

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// デフォルトパスワード（開発環境用）
const DEFAULT_PASSWORD = 'password123';

// パスワードハッシュ化関数
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  // パスワードをハッシュ化
  const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
  console.log('Password hash generated for default password');

  // 役職マスタの作成
  const positions = await Promise.all([
    prisma.position.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: '担当', level: 1 },
    }),
    prisma.position.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: '課長', level: 2 },
    }),
    prisma.position.upsert({
      where: { id: 3 },
      update: {},
      create: { id: 3, name: '部長', level: 3 },
    }),
  ]);

  console.log('Created positions:', positions.map((p) => p.name).join(', '));

  // サンプル営業担当者の作成
  // 部長
  const director = await prisma.salesperson.upsert({
    where: { email: 'director@example.com' },
    update: {},
    create: {
      name: '田中 部長',
      email: 'director@example.com',
      password: hashedPassword,
      positionId: 3,
      isActive: true,
    },
  });

  // 課長
  const manager = await prisma.salesperson.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      name: '鈴木 課長',
      email: 'manager@example.com',
      password: hashedPassword,
      positionId: 2,
      directorId: director.id,
      isActive: true,
    },
  });

  // 担当者
  const staff1 = await prisma.salesperson.upsert({
    where: { email: 'yamada@example.com' },
    update: {},
    create: {
      name: '山田 太郎',
      email: 'yamada@example.com',
      password: hashedPassword,
      positionId: 1,
      managerId: manager.id,
      directorId: director.id,
      isActive: true,
    },
  });

  const staff2 = await prisma.salesperson.upsert({
    where: { email: 'sato@example.com' },
    update: {},
    create: {
      name: '佐藤 花子',
      email: 'sato@example.com',
      password: hashedPassword,
      positionId: 1,
      managerId: manager.id,
      directorId: director.id,
      isActive: true,
    },
  });

  console.log(
    'Created salespersons:',
    [director.name, manager.name, staff1.name, staff2.name].join(', ')
  );

  // サンプル顧客の作成
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        name: '株式会社ABC',
        address: '東京都千代田区丸の内1-1-1',
        phone: '03-1234-5678',
        industry: '製造業',
        isActive: true,
      },
    }),
    prisma.customer.upsert({
      where: { id: 2 },
      update: {},
      create: {
        id: 2,
        name: '株式会社XYZ',
        address: '東京都港区六本木2-2-2',
        phone: '03-2345-6789',
        industry: 'IT・通信',
        isActive: true,
      },
    }),
    prisma.customer.upsert({
      where: { id: 3 },
      update: {},
      create: {
        id: 3,
        name: 'DEF株式会社',
        address: '大阪府大阪市北区梅田3-3-3',
        phone: '06-3456-7890',
        industry: '小売・流通',
        isActive: true,
      },
    }),
    prisma.customer.upsert({
      where: { id: 4 },
      update: {},
      create: {
        id: 4,
        name: 'GHI商事',
        address: '愛知県名古屋市中区栄4-4-4',
        phone: '052-4567-8901',
        industry: '金融・保険',
        isActive: true,
      },
    }),
  ]);

  console.log('Created customers:', customers.map((c) => c.name).join(', '));

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

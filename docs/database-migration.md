# データベースマイグレーション手順

## 概要

本ドキュメントは、営業日報システムのデータベースマイグレーションの実行手順を説明します。

## 前提条件

- Node.js 18.x 以上
- PostgreSQL 15.x 以上
- npm または yarn

## 環境変数の設定

マイグレーションを実行する前に、`.env` ファイルを作成し、データベース接続情報を設定してください。

```bash
# .env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

### 接続文字列の例

```bash
# ローカル開発環境
DATABASE_URL="postgresql://postgres:password@localhost:5432/daily_report_dev"

# Docker環境
DATABASE_URL="postgresql://postgres:password@db:5432/daily_report"

# 本番環境（例）
DATABASE_URL="postgresql://app_user:secure_password@production-db.example.com:5432/daily_report_prod?sslmode=require"
```

## 開発環境でのマイグレーション

### 初回セットアップ

```bash
# 依存関係のインストール
npm install

# Prisma Clientの生成
npm run db:generate

# マイグレーションの実行（開発モード）
npm run db:migrate

# シードデータの投入
npm run db:seed
```

### 新規マイグレーションの作成

```bash
# スキーマを変更後、マイグレーションを作成
npx prisma migrate dev --name <migration_name>
```

### スキーマのリセット（開発環境のみ）

```bash
# データベースをリセットしてマイグレーションを再実行
npx prisma migrate reset
```

## 本番環境でのマイグレーション

### 事前準備

1. **バックアップの取得**
   ```bash
   pg_dump -h HOST -U USER -d DATABASE > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **マイグレーション状況の確認**
   ```bash
   npx prisma migrate status
   ```

3. **マイグレーションの差分確認**
   ```bash
   npx prisma migrate diff \
     --from-schema-datasource prisma/schema.prisma \
     --to-schema-datamodel prisma/schema.prisma \
     --script
   ```

### マイグレーションの実行

```bash
# 本番環境用マイグレーション実行
npx prisma migrate deploy
```

### シードデータの投入（初回のみ）

```bash
npx prisma db seed
```

## Docker環境でのマイグレーション

### docker-compose.ymlの例

```yaml
services:
  app:
    build: .
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/daily_report
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=daily_report
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### マイグレーションの実行

```bash
# コンテナ起動後にマイグレーション実行
docker compose exec app npx prisma migrate deploy

# シードデータ投入
docker compose exec app npx prisma db seed
```

## トラブルシューティング

### マイグレーションが失敗した場合

1. **ログの確認**
   ```bash
   npx prisma migrate status
   ```

2. **失敗したマイグレーションの手動修正**
   - `prisma/migrations` ディレクトリの該当マイグレーションを確認
   - 必要に応じてSQLを手動で修正

3. **マイグレーションの再試行**
   ```bash
   npx prisma migrate deploy
   ```

### データベース接続エラー

- `DATABASE_URL` の形式が正しいか確認
- データベースサーバーが起動しているか確認
- ファイアウォールやセキュリティグループの設定を確認

### スキーマの同期がずれた場合

```bash
# 現在のデータベース状態とスキーマの差分を確認
npx prisma db pull --force

# または、スキーマを強制的にデータベースに反映（開発環境のみ）
npx prisma db push --force-reset
```

## マイグレーション履歴

| バージョン | 日付 | 説明 |
|-----------|------|------|
| 20240101000000_init | 2024-01-01 | 初期スキーマ作成（8テーブル、4Enum） |

## 初期スキーマ構成

### テーブル一覧

| テーブル名 | 説明 |
|-----------|------|
| positions | 役職マスタ |
| salespersons | 営業担当者マスタ |
| customers | 顧客マスタ |
| daily_reports | 日報 |
| visit_records | 訪問記録 |
| attachments | 添付ファイル |
| approval_histories | 承認履歴 |
| comments | コメント |

### Enum一覧

| Enum名 | 値 |
|--------|-----|
| ReportStatus | draft, submitted, manager_approved, approved, rejected |
| VisitResult | negotiating, closed_won, closed_lost, information_gathering, other |
| ApprovalAction | approved, rejected |
| ApprovalLevel | manager, director |

## シードデータ

シードデータには以下のサンプルデータが含まれます：

### 役職マスタ

| ID | 名前 | レベル |
|----|------|-------|
| 1 | 担当 | 1 |
| 2 | 課長 | 2 |
| 3 | 部長 | 3 |

### サンプルユーザー

| メールアドレス | 名前 | 役職 | パスワード |
|---------------|------|------|-----------|
| director@example.com | 田中 部長 | 部長 | password123 |
| manager@example.com | 鈴木 課長 | 課長 | password123 |
| yamada@example.com | 山田 太郎 | 担当 | password123 |
| sato@example.com | 佐藤 花子 | 担当 | password123 |

### サンプル顧客

| 名前 | 業種 |
|------|------|
| 株式会社ABC | 製造業 |
| 株式会社XYZ | IT・通信 |
| DEF株式会社 | 小売・流通 |
| GHI商事 | 金融・保険 |

## 関連ドキュメント

- [API仕様書](./api-specification.md)
- [画面定義書](./screen-definition.md)
- [要件定義書](./requirements.md)

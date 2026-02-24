# Docker Configuration

営業日報システムのDocker環境設定です。

## ファイル構成

```
docker/
├── Dockerfile              # マルチステージDockerfile
├── docker-compose.yml      # 開発環境用
├── docker-compose.prod.yml # 本番環境用
├── nginx.conf              # 本番用Nginx設定
├── .env.example            # 環境変数サンプル
├── init-db/                # DB初期化スクリプト
├── backups/                # DBバックアップ保存先
└── README.md               # このファイル
```

## クイックスタート

### 開発環境

```bash
# 環境変数ファイルを準備
cp docker/.env.example docker/.env

# 開発環境を起動
cd docker
docker-compose up -d

# ログを確認
docker-compose logs -f app
```

開発環境では以下のサービスが利用可能です：

| サービス | URL | 説明 |
|---------|-----|------|
| App | http://localhost:5173 | Vite開発サーバー（ホットリロード対応） |
| PostgreSQL | localhost:5432 | データベース |
| Prisma Studio | http://localhost:5555 | データベースGUI（オプション） |

Prisma Studioを起動する場合：
```bash
docker-compose --profile tools up -d
```

### 本番環境

```bash
# 環境変数ファイルを準備（本番用の値を設定）
cp docker/.env.example docker/.env
# .envファイルを編集して本番用の値を設定

# 本番環境を起動
cd docker
docker-compose -f docker-compose.prod.yml up -d --build

# マイグレーションを実行
docker-compose -f docker-compose.prod.yml --profile migrate up migrate

# シードデータを投入（初回のみ）
docker-compose -f docker-compose.prod.yml --profile seed up seed
```

## よく使うコマンド

### 開発環境

```bash
# サービス起動
docker-compose up -d

# サービス停止
docker-compose down

# ログ確認
docker-compose logs -f [service_name]

# コンテナ内でコマンド実行
docker-compose exec app npm run lint
docker-compose exec app npx prisma migrate dev

# データベースに接続
docker-compose exec db psql -U postgres -d daily_report_db

# 全て削除（ボリューム含む）
docker-compose down -v
```

### 本番環境

```bash
# 起動
docker-compose -f docker-compose.prod.yml up -d --build

# 停止
docker-compose -f docker-compose.prod.yml down

# マイグレーション
docker-compose -f docker-compose.prod.yml --profile migrate up migrate

# バックアップ
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres daily_report_db > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# リストア
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres -d daily_report_db < backups/backup_YYYYMMDD_HHMMSS.sql
```

## 環境変数

| 変数 | 説明 | デフォルト |
|------|------|----------|
| POSTGRES_USER | PostgreSQLユーザー | postgres |
| POSTGRES_PASSWORD | PostgreSQLパスワード | (必須) |
| POSTGRES_DB | データベース名 | daily_report_db |
| DATABASE_URL | Prisma接続URL | - |
| NODE_ENV | 実行環境 | development |
| VITE_API_URL | APIエンドポイント | - |

## トラブルシューティング

### ポートが使用中

```bash
# 使用中のポートを確認
netstat -an | grep 5432
netstat -an | grep 5173

# 別のポートを使用する場合はdocker-compose.ymlのportsを変更
```

### データベース接続エラー

```bash
# DBコンテナの状態を確認
docker-compose ps
docker-compose logs db

# DBが起動しているか確認
docker-compose exec db pg_isready -U postgres
```

### ホットリロードが動作しない

Windowsの場合、WSL2を使用していることを確認してください。
また、`CHOKIDAR_USEPOLLING=true`を環境変数に追加することで解決する場合があります。

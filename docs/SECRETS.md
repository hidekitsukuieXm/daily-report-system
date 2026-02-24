# GitHub Secrets 設定手順

このドキュメントでは、営業日報システムのCI/CDパイプラインで使用するGitHub Secretsの設定方法を説明します。

## 必要なSecrets一覧

| Secret名 | 必須 | 説明 | 例 |
|----------|------|------|-----|
| `DATABASE_URL` | ○ | PostgreSQL接続文字列 | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | ○ | JWT署名用シークレットキー（32文字以上） | `openssl rand -base64 64` で生成 |
| `JWT_EXPIRES_IN` | - | アクセストークン有効期限 | `1h` |
| `REFRESH_TOKEN_EXPIRES_IN` | - | リフレッシュトークン有効期限 | `7d` |
| `CORS_ORIGINS` | - | 許可するオリジン（カンマ区切り） | `https://app.example.com` |

## 設定手順

### 1. GitHubリポジトリの設定画面を開く

1. GitHubでリポジトリページを開く
2. **Settings** タブをクリック
3. 左サイドバーの **Secrets and variables** → **Actions** を選択

### 2. Repository Secretsの追加

各Secretを以下の手順で追加します：

1. **New repository secret** ボタンをクリック
2. **Name** にSecret名を入力
3. **Secret** に値を入力
4. **Add secret** をクリック

### 3. 各Secretの設定

#### DATABASE_URL

```
postgresql://postgres:your_password@your_host:5432/daily_report_db
```

**本番環境での注意事項:**
- 本番DBのパスワードは十分に強力なものを使用
- SSL接続を有効にする場合は `?sslmode=require` を追加
- 例: `postgresql://user:pass@host:5432/db?sslmode=require`

#### JWT_SECRET

セキュアなランダム文字列を生成します：

```bash
# Linux/macOS
openssl rand -base64 64

# または Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

**重要:**
- 32文字以上の文字列を使用すること
- 本番環境と開発環境で異なる値を使用すること
- 決してコードにハードコードしないこと

#### JWT_EXPIRES_IN / REFRESH_TOKEN_EXPIRES_IN

時間指定の形式：
- `15m` - 15分
- `1h` - 1時間
- `7d` - 7日
- `30d` - 30日

推奨値：
- `JWT_EXPIRES_IN`: `1h`（アクセストークン）
- `REFRESH_TOKEN_EXPIRES_IN`: `7d`（リフレッシュトークン）

#### CORS_ORIGINS

許可するオリジンをカンマ区切りで指定：

```
https://app.example.com,https://admin.example.com
```

## 環境別の設定

### GitHub Environments の使用

本番環境と開発環境で異なるSecretを使用する場合は、GitHub Environmentsを活用します：

1. **Settings** → **Environments** を開く
2. **New environment** で環境を作成（例: `production`, `staging`）
3. 各環境に固有のSecretsを設定

### ワークフローでの環境指定

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # この環境のSecretsを使用
    steps:
      - uses: actions/checkout@v4
      # ...
```

## CI/CDワークフローでの使用例

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
      JWT_SECRET: ${{ secrets.JWT_SECRET }}
      JWT_EXPIRES_IN: ${{ secrets.JWT_EXPIRES_IN || '1h' }}
      REFRESH_TOKEN_EXPIRES_IN: ${{ secrets.REFRESH_TOKEN_EXPIRES_IN || '7d' }}
      CORS_ORIGINS: ${{ secrets.CORS_ORIGINS || 'http://localhost:3000' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
```

## セキュリティベストプラクティス

### やるべきこと

- [ ] 本番環境のSecretsは必要最小限の人だけがアクセスできるようにする
- [ ] 定期的にJWT_SECRETをローテーションする
- [ ] 各環境（本番/ステージング/開発）で異なるSecretを使用する
- [ ] Secretの値は十分に長くランダムな文字列を使用する

### やってはいけないこと

- [ ] Secretsをコードにハードコードしない
- [ ] Secretsをログに出力しない
- [ ] Secretsを平文でSlackやメールで共有しない
- [ ] 同じSecretを複数の環境で使い回さない

## トラブルシューティング

### Secretが認識されない場合

1. Secret名のスペルミスがないか確認
2. ワークフローファイルの構文が正しいか確認
3. リポジトリのSettingsでSecretが正しく設定されているか確認

### 環境変数のバリデーションエラー

アプリケーション起動時にバリデーションエラーが発生する場合：

```
Error: Invalid environment variables
  - JWT_SECRET: JWT_SECRET must be at least 32 characters for security
```

→ JWT_SECRETが32文字以上であることを確認してください。

## 参考リンク

- [GitHub Actions - Encrypted secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub Actions - Using environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)

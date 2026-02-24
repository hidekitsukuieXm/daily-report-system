# 利用可能なコマンド一覧

## 開発

| コマンド          | 説明                 |
| ----------------- | -------------------- |
| `npm run dev`     | 開発サーバー起動     |
| `npm run build`   | 本番ビルド           |
| `npm run preview` | ビルド結果プレビュー |

## リント・フォーマット

| コマンド               | 説明                 |
| ---------------------- | -------------------- |
| `npm run lint`         | ESLint実行           |
| `npm run lint:fix`     | ESLint自動修正       |
| `npm run lint:css`     | Stylelint実行        |
| `npm run lint:css:fix` | Stylelint自動修正    |
| `npm run lint:all`     | 全リンター実行       |
| `npm run format`       | Prettier実行         |
| `npm run typecheck`    | TypeScript型チェック |

## テスト

| コマンド                | 説明                      |
| ----------------------- | ------------------------- |
| `npm test`              | テスト実行（watchモード） |
| `npm run test:run`      | テスト実行（1回のみ）     |
| `npm run test:ui`       | テストUI起動              |
| `npm run test:coverage` | カバレッジ計測            |

## データベース（Prisma）

| コマンド              | 説明                         |
| --------------------- | ---------------------------- |
| `npm run db:generate` | Prisma Client生成            |
| `npm run db:migrate`  | マイグレーション実行（開発） |
| `npm run db:push`     | スキーマをDBに直接反映       |
| `npm run db:studio`   | Prisma Studio起動            |
| `npm run db:seed`     | 初期データ投入               |

## Git Hooks（自動実行）

| フック     | 実行タイミング           | 実行内容                                              |
| ---------- | ------------------------ | ----------------------------------------------------- |
| pre-commit | コミット前               | lint-staged（ステージファイルをリント・フォーマット） |
| commit-msg | コミットメッセージ入力後 | commitlint（コミットメッセージ形式チェック）          |

## コミットメッセージ形式

```
<type>(<scope>): <subject>
```

### Type一覧

| Type       | 説明                                         |
| ---------- | -------------------------------------------- |
| `feat`     | 新機能                                       |
| `fix`      | バグ修正                                     |
| `docs`     | ドキュメント                                 |
| `style`    | フォーマット（コードの動作に影響しない変更） |
| `refactor` | リファクタリング                             |
| `perf`     | パフォーマンス改善                           |
| `test`     | テスト追加・修正                             |
| `build`    | ビルドシステム・外部依存関係の変更           |
| `ci`       | CI設定ファイル・スクリプトの変更             |
| `chore`    | その他の変更                                 |
| `revert`   | コミットの取り消し                           |

### 例

```bash
feat(auth): ログイン機能を追加
fix(report): 日報作成時のバリデーションエラーを修正
docs(readme): インストール手順を更新
refactor(api): 認証ミドルウェアを共通化
test(schema): APIスキーマのテストを追加
```

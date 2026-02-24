# 営業日報システム API仕様書

## 1. 概要

### 1.1 基本情報

| 項目       | 内容                             |
| ---------- | -------------------------------- |
| ベースURL  | `https://api.example.com/api/v1` |
| プロトコル | HTTPS                            |
| データ形式 | JSON                             |
| 文字コード | UTF-8                            |
| 認証方式   | Bearer Token (JWT)               |

### 1.2 共通リクエストヘッダー

| ヘッダー名    | 必須 | 説明                              |
| ------------- | ---- | --------------------------------- |
| Content-Type  | ○    | `application/json`                |
| Authorization | ○    | `Bearer {token}` ※ログインAPI以外 |
| Accept        | -    | `application/json`                |

### 1.3 共通レスポンス形式

**成功時**

```json
{
  "success": true,
  "data": { ... }
}
```

**エラー時**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### 1.4 HTTPステータスコード

| コード | 説明                             |
| ------ | -------------------------------- |
| 200    | 成功                             |
| 201    | 作成成功                         |
| 204    | 削除成功（レスポンスボディなし） |
| 400    | リクエスト不正                   |
| 401    | 認証エラー                       |
| 403    | 権限エラー                       |
| 404    | リソース未発見                   |
| 409    | 競合エラー（重複など）           |
| 422    | バリデーションエラー             |
| 500    | サーバーエラー                   |

---

## 2. API一覧

### 2.1 認証API

| メソッド | エンドポイント | 説明                     |
| -------- | -------------- | ------------------------ |
| POST     | /auth/login    | ログイン                 |
| POST     | /auth/logout   | ログアウト               |
| GET      | /auth/me       | ログインユーザー情報取得 |
| POST     | /auth/refresh  | トークンリフレッシュ     |

### 2.2 日報API

| メソッド | エンドポイント      | 説明         |
| -------- | ------------------- | ------------ |
| GET      | /reports            | 日報一覧取得 |
| POST     | /reports            | 日報作成     |
| GET      | /reports/:id        | 日報詳細取得 |
| PUT      | /reports/:id        | 日報更新     |
| DELETE   | /reports/:id        | 日報削除     |
| POST     | /reports/:id/submit | 日報提出     |

### 2.3 訪問記録API

| メソッド | エンドポイント            | 説明             |
| -------- | ------------------------- | ---------------- |
| GET      | /reports/:reportId/visits | 訪問記録一覧取得 |
| POST     | /reports/:reportId/visits | 訪問記録作成     |
| PUT      | /visits/:id               | 訪問記録更新     |
| DELETE   | /visits/:id               | 訪問記録削除     |

### 2.4 添付ファイルAPI

| メソッド | エンドポイント               | 説明                 |
| -------- | ---------------------------- | -------------------- |
| POST     | /visits/:visitId/attachments | ファイルアップロード |
| GET      | /attachments/:id             | ファイルダウンロード |
| DELETE   | /attachments/:id             | ファイル削除         |

### 2.5 承認API

| メソッド | エンドポイント       | 説明             |
| -------- | -------------------- | ---------------- |
| GET      | /approvals           | 承認待ち一覧取得 |
| POST     | /reports/:id/approve | 日報承認         |
| POST     | /reports/:id/reject  | 日報差戻し       |

### 2.6 コメントAPI

| メソッド | エンドポイント              | 説明             |
| -------- | --------------------------- | ---------------- |
| GET      | /reports/:reportId/comments | コメント一覧取得 |
| POST     | /reports/:reportId/comments | コメント作成     |
| PUT      | /comments/:id               | コメント更新     |
| DELETE   | /comments/:id               | コメント削除     |

### 2.7 顧客マスタAPI

| メソッド | エンドポイント | 説明         |
| -------- | -------------- | ------------ |
| GET      | /customers     | 顧客一覧取得 |
| POST     | /customers     | 顧客作成     |
| GET      | /customers/:id | 顧客詳細取得 |
| PUT      | /customers/:id | 顧客更新     |

### 2.8 営業担当者マスタAPI

| メソッド | エンドポイント    | 説明               |
| -------- | ----------------- | ------------------ |
| GET      | /salespersons     | 営業担当者一覧取得 |
| POST     | /salespersons     | 営業担当者作成     |
| GET      | /salespersons/:id | 営業担当者詳細取得 |
| PUT      | /salespersons/:id | 営業担当者更新     |

### 2.9 マスタAPI

| メソッド | エンドポイント | 説明             |
| -------- | -------------- | ---------------- |
| GET      | /positions     | 役職一覧取得     |
| GET      | /industries    | 業種一覧取得     |
| GET      | /visit-results | 訪問結果一覧取得 |

---

## 3. API詳細定義

---

### 3.1 認証API

---

#### POST /auth/login

ログイン認証を行い、アクセストークンを取得する。

**リクエスト**

```json
{
  "email": "yamada@example.com",
  "password": "password123",
  "remember": true
}
```

| パラメータ | 型      | 必須 | 説明                                    |
| ---------- | ------- | ---- | --------------------------------------- |
| email      | string  | ○    | メールアドレス                          |
| password   | string  | ○    | パスワード                              |
| remember   | boolean | -    | ログイン状態を保持（デフォルト: false） |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "id": 1,
      "name": "山田太郎",
      "email": "yamada@example.com",
      "position": {
        "id": 1,
        "name": "担当",
        "level": 1
      }
    }
  }
}
```

**エラーレスポンス**

| コード | エラーコード        | 説明                                             |
| ------ | ------------------- | ------------------------------------------------ |
| 401    | INVALID_CREDENTIALS | メールアドレスまたはパスワードが正しくありません |
| 401    | ACCOUNT_DISABLED    | アカウントが無効です                             |
| 422    | VALIDATION_ERROR    | 入力値が不正です                                 |

---

#### POST /auth/logout

ログアウトし、トークンを無効化する。

**リクエストヘッダー**

| ヘッダー名    | 必須 | 説明                    |
| ------------- | ---- | ----------------------- |
| Authorization | ○    | `Bearer {access_token}` |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "message": "ログアウトしました"
  }
}
```

---

#### GET /auth/me

ログイン中のユーザー情報を取得する。

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "山田太郎",
    "email": "yamada@example.com",
    "position": {
      "id": 1,
      "name": "担当",
      "level": 1
    },
    "manager": {
      "id": 2,
      "name": "鈴木一郎"
    },
    "director": {
      "id": 3,
      "name": "田中部長"
    },
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

---

#### POST /auth/refresh

アクセストークンをリフレッシュする。

**リクエスト**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "expires_in": 3600
  }
}
```

---

### 3.2 日報API

---

#### GET /reports

日報一覧を取得する。

**クエリパラメータ**

| パラメータ     | 型      | 必須 | 説明                                                             |
| -------------- | ------- | ---- | ---------------------------------------------------------------- |
| page           | integer | -    | ページ番号（デフォルト: 1）                                      |
| per_page       | integer | -    | 1ページあたりの件数（デフォルト: 20、最大: 100）                 |
| date_from      | string  | -    | 期間開始日（YYYY-MM-DD）                                         |
| date_to        | string  | -    | 期間終了日（YYYY-MM-DD）                                         |
| salesperson_id | integer | -    | 営業担当者ID（上長のみ指定可）                                   |
| status         | string  | -    | ステータス（draft/submitted/manager_approved/approved/rejected） |
| sort           | string  | -    | ソート項目（report_date/created_at/status）                      |
| order          | string  | -    | ソート順（asc/desc、デフォルト: desc）                           |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "report_date": "2024-01-15",
        "salesperson": {
          "id": 1,
          "name": "山田太郎"
        },
        "status": "submitted",
        "visit_count": 5,
        "submitted_at": "2024-01-15T18:30:00Z",
        "created_at": "2024-01-15T17:00:00Z",
        "updated_at": "2024-01-15T18:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_pages": 5,
      "total_count": 98
    }
  }
}
```

---

#### POST /reports

日報を新規作成する。

**リクエスト**

```json
{
  "report_date": "2024-01-15",
  "problem": "競合他社の価格攻勢が激しい",
  "plan": "ABC社への見積書作成",
  "visits": [
    {
      "customer_id": 1,
      "visit_time": "10:00",
      "content": "新商品の提案を実施",
      "result": "negotiating"
    },
    {
      "customer_id": 2,
      "visit_time": "14:00",
      "content": "定期訪問",
      "result": "information_gathering"
    }
  ]
}
```

| パラメータ           | 型      | 必須 | 説明                         |
| -------------------- | ------- | ---- | ---------------------------- |
| report_date          | string  | ○    | 報告日（YYYY-MM-DD）         |
| problem              | string  | -    | 課題・相談（最大2000文字）   |
| plan                 | string  | -    | 明日やること（最大2000文字） |
| visits               | array   | -    | 訪問記録の配列               |
| visits[].customer_id | integer | ○    | 顧客ID                       |
| visits[].visit_time  | string  | -    | 訪問時刻（HH:MM）            |
| visits[].content     | string  | ○    | 訪問内容（最大2000文字）     |
| visits[].result      | string  | -    | 結果コード                   |

**result（結果）の値**

| 値                    | 説明     |
| --------------------- | -------- |
| negotiating           | 商談中   |
| closed_won            | 成約     |
| closed_lost           | 見送り   |
| information_gathering | 情報収集 |
| other                 | その他   |

**レスポンス（201 Created）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "report_date": "2024-01-15",
    "status": "draft",
    "problem": "競合他社の価格攻勢が激しい",
    "plan": "ABC社への見積書作成",
    "visits": [
      {
        "id": 1,
        "customer": {
          "id": 1,
          "name": "株式会社ABC"
        },
        "visit_time": "10:00",
        "content": "新商品の提案を実施",
        "result": "negotiating",
        "attachments": []
      }
    ],
    "created_at": "2024-01-15T17:00:00Z",
    "updated_at": "2024-01-15T17:00:00Z"
  }
}
```

**エラーレスポンス**

| コード | エラーコード     | 説明                           |
| ------ | ---------------- | ------------------------------ |
| 409    | DUPLICATE_REPORT | この日付の日報は既に存在します |
| 422    | VALIDATION_ERROR | 入力値が不正です               |

---

#### GET /reports/:id

日報の詳細を取得する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 日報ID |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "report_date": "2024-01-15",
    "salesperson": {
      "id": 1,
      "name": "山田太郎",
      "position": {
        "id": 1,
        "name": "担当"
      }
    },
    "status": "submitted",
    "problem": "競合他社の価格攻勢が激しい",
    "plan": "ABC社への見積書作成",
    "submitted_at": "2024-01-15T18:30:00Z",
    "manager_approved_at": null,
    "director_approved_at": null,
    "visits": [
      {
        "id": 1,
        "customer": {
          "id": 1,
          "name": "株式会社ABC"
        },
        "visit_time": "10:00",
        "content": "新商品の提案を実施。担当者は興味を示しており、次回見積書を持参予定。",
        "result": "negotiating",
        "result_label": "商談中",
        "attachments": [
          {
            "id": 1,
            "file_name": "proposal.pdf",
            "file_size": 1024000,
            "content_type": "application/pdf",
            "download_url": "/api/v1/attachments/1",
            "created_at": "2024-01-15T17:30:00Z"
          }
        ]
      }
    ],
    "approval_history": [
      {
        "id": 1,
        "approver": {
          "id": 2,
          "name": "鈴木課長"
        },
        "action": "approved",
        "action_label": "承認",
        "approval_level": "manager",
        "comment": "良い提案ですね",
        "created_at": "2024-01-15T19:00:00Z"
      }
    ],
    "comments": [
      {
        "id": 1,
        "commenter": {
          "id": 2,
          "name": "鈴木課長"
        },
        "content": "ABC社の件、フォローお願いします",
        "created_at": "2024-01-15T19:05:00Z",
        "updated_at": "2024-01-15T19:05:00Z"
      }
    ],
    "created_at": "2024-01-15T17:00:00Z",
    "updated_at": "2024-01-15T18:30:00Z"
  }
}
```

---

#### PUT /reports/:id

日報を更新する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 日報ID |

**リクエスト**

```json
{
  "problem": "競合他社の価格攻勢が激しく、差別化ポイントの整理が必要",
  "plan": "ABC社への見積書作成\nDEF社へのアポイント取得"
}
```

| パラメータ | 型     | 必須 | 説明         |
| ---------- | ------ | ---- | ------------ |
| problem    | string | -    | 課題・相談   |
| plan       | string | -    | 明日やること |

**レスポンス（200 OK）**

GET /reports/:id と同様のレスポンス

**エラーレスポンス**

| コード | エラーコード   | 説明                       |
| ------ | -------------- | -------------------------- |
| 403    | FORBIDDEN      | 編集権限がありません       |
| 403    | INVALID_STATUS | この状態では編集できません |
| 404    | NOT_FOUND      | 日報が見つかりません       |

---

#### DELETE /reports/:id

日報を削除する（下書き状態のみ）。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 日報ID |

**レスポンス（204 No Content）**

レスポンスボディなし

**エラーレスポンス**

| コード | エラーコード   | 説明                             |
| ------ | -------------- | -------------------------------- |
| 403    | INVALID_STATUS | 下書き状態の日報のみ削除可能です |

---

#### POST /reports/:id/submit

日報を提出する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 日報ID |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "submitted",
    "submitted_at": "2024-01-15T18:30:00Z"
  }
}
```

**エラーレスポンス**

| コード | エラーコード   | 説明                                         |
| ------ | -------------- | -------------------------------------------- |
| 403    | INVALID_STATUS | 下書きまたは差戻し状態の日報のみ提出可能です |
| 422    | NO_VISITS      | 訪問記録を1件以上入力してください            |

---

### 3.3 訪問記録API

---

#### GET /reports/:reportId/visits

訪問記録一覧を取得する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| reportId   | integer | ○    | 日報ID |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "customer": {
          "id": 1,
          "name": "株式会社ABC"
        },
        "visit_time": "10:00",
        "content": "新商品の提案を実施",
        "result": "negotiating",
        "result_label": "商談中",
        "attachments": [
          {
            "id": 1,
            "file_name": "proposal.pdf",
            "file_size": 1024000
          }
        ],
        "created_at": "2024-01-15T17:00:00Z",
        "updated_at": "2024-01-15T17:00:00Z"
      }
    ]
  }
}
```

---

#### POST /reports/:reportId/visits

訪問記録を追加する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| reportId   | integer | ○    | 日報ID |

**リクエスト**

```json
{
  "customer_id": 1,
  "visit_time": "10:00",
  "content": "新商品の提案を実施",
  "result": "negotiating"
}
```

**レスポンス（201 Created）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "customer": {
      "id": 1,
      "name": "株式会社ABC"
    },
    "visit_time": "10:00",
    "content": "新商品の提案を実施",
    "result": "negotiating",
    "result_label": "商談中",
    "attachments": [],
    "created_at": "2024-01-15T17:00:00Z",
    "updated_at": "2024-01-15T17:00:00Z"
  }
}
```

---

#### PUT /visits/:id

訪問記録を更新する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明       |
| ---------- | ------- | ---- | ---------- |
| id         | integer | ○    | 訪問記録ID |

**リクエスト**

```json
{
  "customer_id": 1,
  "visit_time": "10:30",
  "content": "新商品の提案を実施。好感触。",
  "result": "negotiating"
}
```

**レスポンス（200 OK）**

POST /reports/:reportId/visits と同様のレスポンス

---

#### DELETE /visits/:id

訪問記録を削除する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明       |
| ---------- | ------- | ---- | ---------- |
| id         | integer | ○    | 訪問記録ID |

**レスポンス（204 No Content）**

レスポンスボディなし

---

### 3.4 添付ファイルAPI

---

#### POST /visits/:visitId/attachments

ファイルをアップロードする。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明       |
| ---------- | ------- | ---- | ---------- |
| visitId    | integer | ○    | 訪問記録ID |

**リクエスト**

Content-Type: `multipart/form-data`

| パラメータ | 型   | 必須 | 説明                             |
| ---------- | ---- | ---- | -------------------------------- |
| file       | file | ○    | アップロードファイル（最大10MB） |

**許可されるファイル形式**

| 拡張子     | MIMEタイプ                                                                |
| ---------- | ------------------------------------------------------------------------- |
| .pdf       | application/pdf                                                           |
| .doc       | application/msword                                                        |
| .docx      | application/vnd.openxmlformats-officedocument.wordprocessingml.document   |
| .xls       | application/vnd.ms-excel                                                  |
| .xlsx      | application/vnd.openxmlformats-officedocument.spreadsheetml.sheet         |
| .ppt       | application/vnd.ms-powerpoint                                             |
| .pptx      | application/vnd.openxmlformats-officedocument.presentationml.presentation |
| .jpg/.jpeg | image/jpeg                                                                |
| .png       | image/png                                                                 |

**レスポンス（201 Created）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "file_name": "proposal.pdf",
    "file_size": 1024000,
    "content_type": "application/pdf",
    "download_url": "/api/v1/attachments/1",
    "created_at": "2024-01-15T17:30:00Z"
  }
}
```

**エラーレスポンス**

| コード | エラーコード          | 説明                                   |
| ------ | --------------------- | -------------------------------------- |
| 413    | FILE_TOO_LARGE        | ファイルサイズは10MB以下にしてください |
| 415    | UNSUPPORTED_FILE_TYPE | サポートされていないファイル形式です   |

---

#### GET /attachments/:id

ファイルをダウンロードする。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明           |
| ---------- | ------- | ---- | -------------- |
| id         | integer | ○    | 添付ファイルID |

**レスポンス（200 OK）**

Content-Type: ファイルのMIMEタイプ
Content-Disposition: `attachment; filename="proposal.pdf"`

バイナリデータ

---

#### DELETE /attachments/:id

ファイルを削除する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明           |
| ---------- | ------- | ---- | -------------- |
| id         | integer | ○    | 添付ファイルID |

**レスポンス（204 No Content）**

レスポンスボディなし

---

### 3.5 承認API

---

#### GET /approvals

承認待ち日報一覧を取得する（課長・部長のみ）。

**クエリパラメータ**

| パラメータ | 型      | 必須 | 説明                                  |
| ---------- | ------- | ---- | ------------------------------------- |
| page       | integer | -    | ページ番号（デフォルト: 1）           |
| per_page   | integer | -    | 1ページあたりの件数（デフォルト: 20） |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "report_date": "2024-01-15",
        "salesperson": {
          "id": 1,
          "name": "山田太郎"
        },
        "status": "submitted",
        "visit_count": 5,
        "submitted_at": "2024-01-15T18:30:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_pages": 1,
      "total_count": 5
    }
  }
}
```

---

#### POST /reports/:id/approve

日報を承認する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 日報ID |

**リクエスト**

```json
{
  "comment": "良い提案ですね"
}
```

| パラメータ | 型     | 必須 | 説明         |
| ---------- | ------ | ---- | ------------ |
| comment    | string | -    | 承認コメント |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "manager_approved",
    "manager_approved_at": "2024-01-15T19:00:00Z",
    "approval_history": [
      {
        "id": 1,
        "approver": {
          "id": 2,
          "name": "鈴木課長"
        },
        "action": "approved",
        "approval_level": "manager",
        "comment": "良い提案ですね",
        "created_at": "2024-01-15T19:00:00Z"
      }
    ]
  }
}
```

**エラーレスポンス**

| コード | エラーコード   | 説明                       |
| ------ | -------------- | -------------------------- |
| 403    | FORBIDDEN      | 承認権限がありません       |
| 403    | INVALID_STATUS | この状態では承認できません |

---

#### POST /reports/:id/reject

日報を差戻しする。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 日報ID |

**リクエスト**

```json
{
  "comment": "訪問内容をもう少し詳しく記載してください"
}
```

| パラメータ | 型     | 必須 | 説明       |
| ---------- | ------ | ---- | ---------- |
| comment    | string | ○    | 差戻し理由 |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "rejected",
    "approval_history": [
      {
        "id": 1,
        "approver": {
          "id": 2,
          "name": "鈴木課長"
        },
        "action": "rejected",
        "approval_level": "manager",
        "comment": "訪問内容をもう少し詳しく記載してください",
        "created_at": "2024-01-15T19:00:00Z"
      }
    ]
  }
}
```

---

### 3.6 コメントAPI

---

#### GET /reports/:reportId/comments

コメント一覧を取得する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| reportId   | integer | ○    | 日報ID |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "commenter": {
          "id": 2,
          "name": "鈴木課長",
          "position": {
            "id": 2,
            "name": "課長"
          }
        },
        "content": "ABC社の件、フォローお願いします",
        "created_at": "2024-01-15T19:05:00Z",
        "updated_at": "2024-01-15T19:05:00Z"
      }
    ]
  }
}
```

---

#### POST /reports/:reportId/comments

コメントを投稿する（課長・部長のみ）。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| reportId   | integer | ○    | 日報ID |

**リクエスト**

```json
{
  "content": "ABC社の件、フォローお願いします"
}
```

| パラメータ | 型     | 必須 | 説明                         |
| ---------- | ------ | ---- | ---------------------------- |
| content    | string | ○    | コメント内容（最大2000文字） |

**レスポンス（201 Created）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "commenter": {
      "id": 2,
      "name": "鈴木課長"
    },
    "content": "ABC社の件、フォローお願いします",
    "created_at": "2024-01-15T19:05:00Z",
    "updated_at": "2024-01-15T19:05:00Z"
  }
}
```

---

#### PUT /comments/:id

コメントを更新する（投稿者のみ）。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明       |
| ---------- | ------- | ---- | ---------- |
| id         | integer | ○    | コメントID |

**リクエスト**

```json
{
  "content": "ABC社の件、明日中にフォローお願いします"
}
```

**レスポンス（200 OK）**

POST /reports/:reportId/comments と同様のレスポンス

---

#### DELETE /comments/:id

コメントを削除する（投稿者のみ）。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明       |
| ---------- | ------- | ---- | ---------- |
| id         | integer | ○    | コメントID |

**レスポンス（204 No Content）**

レスポンスボディなし

---

### 3.7 顧客マスタAPI

---

#### GET /customers

顧客一覧を取得する。

**クエリパラメータ**

| パラメータ | 型      | 必須 | 説明                                  |
| ---------- | ------- | ---- | ------------------------------------- |
| page       | integer | -    | ページ番号（デフォルト: 1）           |
| per_page   | integer | -    | 1ページあたりの件数（デフォルト: 20） |
| name       | string  | -    | 顧客名（部分一致）                    |
| industry   | string  | -    | 業種                                  |
| is_active  | boolean | -    | 有効フラグ                            |
| sort       | string  | -    | ソート項目（name/created_at）         |
| order      | string  | -    | ソート順（asc/desc）                  |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "株式会社ABC",
        "address": "東京都千代田区...",
        "phone": "03-1234-5678",
        "industry": "製造業",
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_pages": 3,
      "total_count": 50
    }
  }
}
```

---

#### POST /customers

顧客を新規作成する（課長・部長のみ）。

**リクエスト**

```json
{
  "name": "株式会社ABC",
  "address": "東京都千代田区...",
  "phone": "03-1234-5678",
  "industry": "製造業"
}
```

| パラメータ | 型     | 必須 | 説明                   |
| ---------- | ------ | ---- | ---------------------- |
| name       | string | ○    | 顧客名（最大200文字）  |
| address    | string | -    | 住所（最大500文字）    |
| phone      | string | -    | 電話番号（最大20文字） |
| industry   | string | -    | 業種                   |

**レスポンス（201 Created）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "株式会社ABC",
    "address": "東京都千代田区...",
    "phone": "03-1234-5678",
    "industry": "製造業",
    "is_active": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

---

#### GET /customers/:id

顧客詳細を取得する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 顧客ID |

**レスポンス（200 OK）**

POST /customers と同様のレスポンス

---

#### PUT /customers/:id

顧客を更新する（課長・部長のみ）。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明   |
| ---------- | ------- | ---- | ------ |
| id         | integer | ○    | 顧客ID |

**リクエスト**

```json
{
  "name": "株式会社ABC",
  "address": "東京都千代田区...",
  "phone": "03-1234-5678",
  "industry": "製造業",
  "is_active": true
}
```

**レスポンス（200 OK）**

POST /customers と同様のレスポンス

---

### 3.8 営業担当者マスタAPI

---

#### GET /salespersons

営業担当者一覧を取得する（課長・部長のみ）。

**クエリパラメータ**

| パラメータ  | 型      | 必須 | 説明                                  |
| ----------- | ------- | ---- | ------------------------------------- |
| page        | integer | -    | ページ番号（デフォルト: 1）           |
| per_page    | integer | -    | 1ページあたりの件数（デフォルト: 20） |
| name        | string  | -    | 氏名（部分一致）                      |
| position_id | integer | -    | 役職ID                                |
| is_active   | boolean | -    | 有効フラグ                            |

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "山田太郎",
        "email": "yamada@example.com",
        "position": {
          "id": 1,
          "name": "担当",
          "level": 1
        },
        "manager": {
          "id": 2,
          "name": "鈴木一郎"
        },
        "director": {
          "id": 3,
          "name": "田中部長"
        },
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_pages": 1,
      "total_count": 15
    }
  }
}
```

---

#### POST /salespersons

営業担当者を新規作成する（部長のみ）。

**リクエスト**

```json
{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "position_id": 1,
  "manager_id": 2,
  "director_id": 3,
  "password": "initialPassword123"
}
```

| パラメータ  | 型      | 必須 | 説明                        |
| ----------- | ------- | ---- | --------------------------- |
| name        | string  | ○    | 氏名（最大100文字）         |
| email       | string  | ○    | メールアドレス（一意）      |
| position_id | integer | ○    | 役職ID                      |
| manager_id  | integer | -    | 直属上長ID                  |
| director_id | integer | -    | 2次上長ID                   |
| password    | string  | ○    | 初期パスワード（8文字以上） |

**レスポンス（201 Created）**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "山田太郎",
    "email": "yamada@example.com",
    "position": {
      "id": 1,
      "name": "担当",
      "level": 1
    },
    "manager": {
      "id": 2,
      "name": "鈴木一郎"
    },
    "director": {
      "id": 3,
      "name": "田中部長"
    },
    "is_active": true,
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

**エラーレスポンス**

| コード | エラーコード    | 説明                                     |
| ------ | --------------- | ---------------------------------------- |
| 409    | DUPLICATE_EMAIL | このメールアドレスは既に登録されています |

---

#### GET /salespersons/:id

営業担当者詳細を取得する。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明         |
| ---------- | ------- | ---- | ------------ |
| id         | integer | ○    | 営業担当者ID |

**レスポンス（200 OK）**

POST /salespersons と同様のレスポンス

---

#### PUT /salespersons/:id

営業担当者を更新する（部長のみ）。

**パスパラメータ**

| パラメータ | 型      | 必須 | 説明         |
| ---------- | ------- | ---- | ------------ |
| id         | integer | ○    | 営業担当者ID |

**リクエスト**

```json
{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "position_id": 1,
  "manager_id": 2,
  "director_id": 3,
  "is_active": true,
  "reset_password": false
}
```

| パラメータ     | 型      | 必須 | 説明                     |
| -------------- | ------- | ---- | ------------------------ |
| name           | string  | -    | 氏名                     |
| email          | string  | -    | メールアドレス           |
| position_id    | integer | -    | 役職ID                   |
| manager_id     | integer | -    | 直属上長ID               |
| director_id    | integer | -    | 2次上長ID                |
| is_active      | boolean | -    | 有効フラグ               |
| reset_password | boolean | -    | パスワードリセットフラグ |

**レスポンス（200 OK）**

POST /salespersons と同様のレスポンス

---

### 3.9 マスタAPI

---

#### GET /positions

役職一覧を取得する。

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": 1, "name": "担当", "level": 1 },
      { "id": 2, "name": "課長", "level": 2 },
      { "id": 3, "name": "部長", "level": 3 }
    ]
  }
}
```

---

#### GET /industries

業種一覧を取得する。

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "items": [
      { "code": "manufacturing", "name": "製造業" },
      { "code": "it", "name": "IT・通信" },
      { "code": "finance", "name": "金融・保険" },
      { "code": "retail", "name": "小売・流通" },
      { "code": "construction", "name": "建設・不動産" },
      { "code": "service", "name": "サービス" },
      { "code": "other", "name": "その他" }
    ]
  }
}
```

---

#### GET /visit-results

訪問結果一覧を取得する。

**レスポンス（200 OK）**

```json
{
  "success": true,
  "data": {
    "items": [
      { "code": "negotiating", "name": "商談中" },
      { "code": "closed_won", "name": "成約" },
      { "code": "closed_lost", "name": "見送り" },
      { "code": "information_gathering", "name": "情報収集" },
      { "code": "other", "name": "その他" }
    ]
  }
}
```

---

## 4. エラーコード一覧

### 4.1 共通エラー

| エラーコード     | HTTPステータス | 説明                             |
| ---------------- | -------------- | -------------------------------- |
| UNAUTHORIZED     | 401            | 認証が必要です                   |
| INVALID_TOKEN    | 401            | トークンが無効です               |
| TOKEN_EXPIRED    | 401            | トークンの有効期限が切れています |
| FORBIDDEN        | 403            | 権限がありません                 |
| NOT_FOUND        | 404            | リソースが見つかりません         |
| VALIDATION_ERROR | 422            | 入力値が不正です                 |
| INTERNAL_ERROR   | 500            | サーバーエラーが発生しました     |

### 4.2 認証エラー

| エラーコード        | HTTPステータス | 説明                                             |
| ------------------- | -------------- | ------------------------------------------------ |
| INVALID_CREDENTIALS | 401            | メールアドレスまたはパスワードが正しくありません |
| ACCOUNT_DISABLED    | 401            | アカウントが無効です                             |

### 4.3 日報エラー

| エラーコード     | HTTPステータス | 説明                              |
| ---------------- | -------------- | --------------------------------- |
| DUPLICATE_REPORT | 409            | この日付の日報は既に存在します    |
| INVALID_STATUS   | 403            | この状態では操作できません        |
| NO_VISITS        | 422            | 訪問記録を1件以上入力してください |

### 4.4 ファイルエラー

| エラーコード          | HTTPステータス | 説明                                   |
| --------------------- | -------------- | -------------------------------------- |
| FILE_TOO_LARGE        | 413            | ファイルサイズは10MB以下にしてください |
| UNSUPPORTED_FILE_TYPE | 415            | サポートされていないファイル形式です   |

### 4.5 マスタエラー

| エラーコード    | HTTPステータス | 説明                                     |
| --------------- | -------------- | ---------------------------------------- |
| DUPLICATE_EMAIL | 409            | このメールアドレスは既に登録されています |

---

## 5. 認可ルール

### 5.1 役職別アクセス権限

| API                 | 担当者                   | 課長      | 部長      |
| ------------------- | ------------------------ | --------- | --------- |
| 日報作成            | ○（自分）                | -         | -         |
| 日報編集            | ○（自分・下書き/差戻し） | -         | -         |
| 日報閲覧            | ○（自分）                | ○（部下） | ○（全員） |
| 日報提出            | ○（自分）                | -         | -         |
| 課長承認            | -                        | ○（部下） | -         |
| 部長承認            | -                        | -         | ○（全員） |
| コメント投稿        | -                        | ○         | ○         |
| 顧客作成/編集       | -                        | ○         | ○         |
| 営業担当者作成/編集 | -                        | -         | ○         |

### 5.2 ステータス別操作権限

| 操作       | draft | submitted | manager_approved | approved | rejected |
| ---------- | ----- | --------- | ---------------- | -------- | -------- |
| 編集       | ○     | -         | -                | -        | ○        |
| 削除       | ○     | -         | -                | -        | -        |
| 提出       | ○     | -         | -                | -        | ○        |
| 課長承認   | -     | ○         | -                | -        | -        |
| 課長差戻し | -     | ○         | -                | -        | -        |
| 部長承認   | -     | -         | ○                | -        | -        |
| 部長差戻し | -     | -         | ○                | -        | -        |

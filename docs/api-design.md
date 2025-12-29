# API設計書

## 工事写真管理システム (PhotoManagement)

| 項目 | 内容 |
|------|------|
| ドキュメントID | API-001 |
| バージョン | 1.0.0 |
| 作成日 | 2025-12-28 |
| ステータス | Draft |

---

## 1. API概要

### 1.1 基本情報

| 項目 | 値 |
|------|-----|
| ベースURL | `https://api.photomanagement.app/v1` |
| プロトコル | HTTPS |
| 認証方式 | Bearer Token (JWT) |
| データ形式 | JSON |
| 文字コード | UTF-8 |

### 1.2 共通ヘッダー

```http
Authorization: Bearer <access_token>
Content-Type: application/json
Accept: application/json
X-Request-ID: <uuid>
```

### 1.3 共通レスポンス形式

#### 成功時

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-12-28T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

#### 一覧取得時（ページネーション）

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "perPage": 20,
    "totalPages": 5
  },
  "meta": {
    "timestamp": "2025-12-28T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

#### エラー時

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-12-28T00:00:00.000Z",
    "requestId": "uuid"
  }
}
```

### 1.4 HTTPステータスコード

| コード | 説明 | 用途 |
|--------|------|------|
| 200 | OK | 成功（取得・更新） |
| 201 | Created | 成功（作成） |
| 204 | No Content | 成功（削除） |
| 400 | Bad Request | リクエスト不正 |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 権限エラー |
| 404 | Not Found | リソース未発見 |
| 409 | Conflict | 競合エラー |
| 422 | Unprocessable Entity | バリデーションエラー |
| 429 | Too Many Requests | レート制限 |
| 500 | Internal Server Error | サーバーエラー |

### 1.5 レート制限

| 対象 | 制限 |
|------|------|
| 認証済みユーザー | 1000 req/分 |
| 未認証 | 100 req/分 |
| ファイルアップロード | 100 req/分 |

---

## 2. 認証API

### 2.1 ログイン

```http
POST /auth/login
```

#### リクエスト

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### レスポンス (200)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "山田太郎"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 2.2 トークンリフレッシュ

```http
POST /auth/refresh
```

#### リクエスト

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2.3 ログアウト

```http
POST /auth/logout
```

### 2.4 パスワードリセット要求

```http
POST /auth/password/reset-request
```

#### リクエスト

```json
{
  "email": "user@example.com"
}
```

### 2.5 パスワードリセット実行

```http
POST /auth/password/reset
```

#### リクエスト

```json
{
  "token": "reset-token",
  "password": "newPassword123",
  "passwordConfirmation": "newPassword123"
}
```

---

## 3. ユーザーAPI

### 3.1 現在のユーザー情報取得

```http
GET /users/me
```

#### レスポンス (200)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "山田太郎",
    "avatarUrl": "https://...",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 3.2 ユーザー情報更新

```http
PATCH /users/me
```

#### リクエスト

```json
{
  "name": "山田次郎",
  "avatarUrl": "https://..."
}
```

---

## 4. 組織API

### 4.1 組織一覧取得

```http
GET /organizations
```

#### レスポンス (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "株式会社サンプル建設",
      "slug": "sample-kensetsu",
      "role": "owner",
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4.2 組織作成

```http
POST /organizations
```

#### リクエスト

```json
{
  "name": "株式会社サンプル建設",
  "slug": "sample-kensetsu"
}
```

### 4.3 組織メンバー一覧

```http
GET /organizations/{orgId}/members
```

### 4.4 組織メンバー招待

```http
POST /organizations/{orgId}/members/invite
```

#### リクエスト

```json
{
  "email": "newmember@example.com",
  "role": "member"
}
```

---

## 5. 工事（プロジェクト）API

### 5.1 工事一覧取得

```http
GET /organizations/{orgId}/projects
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| page | integer | No | ページ番号（デフォルト: 1） |
| perPage | integer | No | 件数（デフォルト: 20, 最大: 100） |
| status | string | No | ステータス（active/completed/archived） |
| search | string | No | 検索キーワード |
| sortBy | string | No | ソート項目（name/createdAt/startDate） |
| sortOrder | string | No | ソート順（asc/desc） |

#### レスポンス (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "○○道路改良工事",
      "code": "R5-001",
      "clientName": "国土交通省",
      "contractorName": "株式会社サンプル建設",
      "location": "東京都○○区",
      "startDate": "2025-04-01",
      "endDate": "2026-03-31",
      "status": "active",
      "photoCount": 1234,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "perPage": 20,
    "totalPages": 3
  }
}
```

### 5.2 工事詳細取得

```http
GET /organizations/{orgId}/projects/{projectId}
```

#### レスポンス (200)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "○○道路改良工事",
    "code": "R5-001",
    "clientName": "国土交通省",
    "contractorName": "株式会社サンプル建設",
    "location": "東京都○○区",
    "startDate": "2025-04-01",
    "endDate": "2026-03-31",
    "status": "active",
    "description": "工事概要...",
    "photoCount": 1234,
    "memberCount": 5,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-06-01T00:00:00.000Z"
  }
}
```

### 5.3 工事作成

```http
POST /organizations/{orgId}/projects
```

#### リクエスト

```json
{
  "name": "○○道路改良工事",
  "code": "R5-001",
  "clientName": "国土交通省",
  "contractorName": "株式会社サンプル建設",
  "location": "東京都○○区",
  "startDate": "2025-04-01",
  "endDate": "2026-03-31",
  "description": "工事概要..."
}
```

### 5.4 工事更新

```http
PATCH /organizations/{orgId}/projects/{projectId}
```

### 5.5 工事削除（アーカイブ）

```http
DELETE /organizations/{orgId}/projects/{projectId}
```

---

## 6. カテゴリ（工種・種別・細別）API

### 6.1 カテゴリ一覧取得

```http
GET /projects/{projectId}/categories
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| type | string | No | 種別（construction/type/detail） |
| parentId | uuid | No | 親カテゴリID |

#### レスポンス (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "土工",
      "type": "construction",
      "code": "0100",
      "parentId": null,
      "sortOrder": 1,
      "photoCount": 500,
      "children": [
        {
          "id": "uuid",
          "name": "切土",
          "type": "type",
          "code": "0101",
          "parentId": "uuid",
          "sortOrder": 1,
          "photoCount": 200,
          "children": [...]
        }
      ]
    }
  ]
}
```

### 6.2 カテゴリ作成

```http
POST /projects/{projectId}/categories
```

#### リクエスト

```json
{
  "name": "土工",
  "type": "construction",
  "code": "0100",
  "parentId": null,
  "sortOrder": 1
}
```

### 6.3 カテゴリ更新

```http
PATCH /projects/{projectId}/categories/{categoryId}
```

### 6.4 カテゴリ削除

```http
DELETE /projects/{projectId}/categories/{categoryId}
```

### 6.5 標準工種インポート

```http
POST /projects/{projectId}/categories/import-standard
```

#### リクエスト

```json
{
  "template": "mlit-civil-2024"
}
```

---

## 7. 写真API

### 7.1 写真一覧取得

```http
GET /projects/{projectId}/photos
```

#### クエリパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|------|------|------|
| page | integer | No | ページ番号 |
| perPage | integer | No | 件数 |
| categoryId | uuid | No | カテゴリID |
| takenFrom | date | No | 撮影日（開始） |
| takenTo | date | No | 撮影日（終了） |
| search | string | No | 検索キーワード |
| hasBlackboard | boolean | No | 小黒板有無 |
| sortBy | string | No | ソート項目 |
| sortOrder | string | No | ソート順 |

#### レスポンス (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "掘削状況",
      "description": "No.1測点 掘削完了",
      "thumbnailUrl": "https://...",
      "category": {
        "id": "uuid",
        "name": "掘削",
        "path": "土工 > 切土 > 掘削"
      },
      "takenAt": "2025-06-15T10:30:00.000Z",
      "takenLocation": {
        "latitude": 35.6812,
        "longitude": 139.7671
      },
      "hasBlackboard": true,
      "createdBy": {
        "id": "uuid",
        "name": "山田太郎"
      },
      "createdAt": "2025-06-15T12:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

### 7.2 写真詳細取得

```http
GET /projects/{projectId}/photos/{photoId}
```

#### レスポンス (200)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "掘削状況",
    "description": "No.1測点 掘削完了",
    "originalUrl": "https://...",
    "thumbnailUrl": "https://...",
    "compositeUrl": "https://...",
    "category": {
      "id": "uuid",
      "name": "掘削",
      "path": "土工 > 切土 > 掘削"
    },
    "takenAt": "2025-06-15T10:30:00.000Z",
    "takenLocation": {
      "latitude": 35.6812,
      "longitude": 139.7671
    },
    "exifData": {
      "make": "Apple",
      "model": "iPhone 15 Pro",
      "exposureTime": "1/125",
      "fNumber": 1.78,
      "iso": 100
    },
    "fileSize": 4500000,
    "width": 4032,
    "height": 3024,
    "mimeType": "image/jpeg",
    "blackboard": {
      "id": "uuid",
      "content": { ... }
    },
    "createdBy": {
      "id": "uuid",
      "name": "山田太郎"
    },
    "createdAt": "2025-06-15T12:00:00.000Z",
    "updatedAt": "2025-06-15T12:00:00.000Z"
  }
}
```

### 7.3 写真アップロード（署名付きURL取得）

```http
POST /projects/{projectId}/photos/upload-url
```

#### リクエスト

```json
{
  "filename": "IMG_0001.jpg",
  "mimeType": "image/jpeg",
  "fileSize": 4500000
}
```

#### レスポンス (200)

```json
{
  "success": true,
  "data": {
    "uploadId": "uuid",
    "uploadUrl": "https://r2.cloudflarestorage.com/...",
    "expiresAt": "2025-12-28T01:00:00.000Z"
  }
}
```

### 7.4 写真アップロード完了通知

```http
POST /projects/{projectId}/photos/upload-complete
```

#### リクエスト

```json
{
  "uploadId": "uuid",
  "title": "掘削状況",
  "categoryId": "uuid",
  "blackboardId": "uuid"
}
```

### 7.5 写真一括アップロード

```http
POST /projects/{projectId}/photos/bulk-upload-url
```

#### リクエスト

```json
{
  "files": [
    {
      "filename": "IMG_0001.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 4500000
    },
    {
      "filename": "IMG_0002.jpg",
      "mimeType": "image/jpeg",
      "fileSize": 3800000
    }
  ]
}
```

### 7.6 写真更新

```http
PATCH /projects/{projectId}/photos/{photoId}
```

#### リクエスト

```json
{
  "title": "掘削状況（修正）",
  "description": "No.1測点 掘削完了 - 修正",
  "categoryId": "uuid"
}
```

### 7.7 写真一括更新

```http
PATCH /projects/{projectId}/photos/bulk
```

#### リクエスト

```json
{
  "photoIds": ["uuid1", "uuid2", "uuid3"],
  "updates": {
    "categoryId": "uuid"
  }
}
```

### 7.8 写真削除

```http
DELETE /projects/{projectId}/photos/{photoId}
```

### 7.9 写真一括削除

```http
DELETE /projects/{projectId}/photos/bulk
```

#### リクエスト

```json
{
  "photoIds": ["uuid1", "uuid2", "uuid3"]
}
```

---

## 8. 電子小黒板API

### 8.1 小黒板テンプレート一覧

```http
GET /blackboard/templates
```

#### レスポンス (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "mlit-standard",
      "name": "国交省標準",
      "preview": "https://...",
      "fields": [
        { "key": "projectName", "label": "工事名", "required": true },
        { "key": "constructionType", "label": "工種", "required": true },
        { "key": "location", "label": "撮影箇所", "required": true },
        { "key": "date", "label": "撮影日", "required": true },
        { "key": "note", "label": "備考", "required": false }
      ]
    }
  ]
}
```

### 8.2 小黒板作成

```http
POST /projects/{projectId}/blackboards
```

#### リクエスト

```json
{
  "templateId": "mlit-standard",
  "content": {
    "projectName": "○○道路改良工事",
    "constructionType": "土工 > 切土 > 掘削",
    "location": "No.1測点",
    "date": "2025-06-15",
    "note": "掘削完了"
  },
  "position": "bottom-right",
  "size": 30
}
```

### 8.3 小黒板詳細取得

```http
GET /projects/{projectId}/blackboards/{blackboardId}
```

### 8.4 小黒板更新

```http
PATCH /projects/{projectId}/blackboards/{blackboardId}
```

### 8.5 小黒板削除

```http
DELETE /projects/{projectId}/blackboards/{blackboardId}
```

### 8.6 写真に小黒板合成

```http
POST /projects/{projectId}/photos/{photoId}/compose-blackboard
```

#### リクエスト

```json
{
  "blackboardId": "uuid",
  "position": "bottom-right",
  "size": 30
}
```

---

## 9. 電子納品API

### 9.1 電子納品プレビュー生成

```http
POST /projects/{projectId}/exports/preview
```

#### リクエスト

```json
{
  "format": "mlit-2022",
  "photoIds": ["uuid1", "uuid2"],
  "options": {
    "includeOriginal": true,
    "maxPhotoSize": 2000000
  }
}
```

#### レスポンス (200)

```json
{
  "success": true,
  "data": {
    "structure": {
      "PHOTO": {
        "PIC": ["P0000001.JPG", "P0000002.JPG"],
        "PHOTO.XML": "..."
      }
    },
    "validation": {
      "valid": true,
      "warnings": [],
      "errors": []
    }
  }
}
```

### 9.2 電子納品データ生成

```http
POST /projects/{projectId}/exports
```

#### リクエスト

```json
{
  "format": "mlit-2022",
  "photoIds": ["uuid1", "uuid2"],
  "options": {
    "includeOriginal": true,
    "maxPhotoSize": 2000000,
    "splitSize": 700000000
  }
}
```

#### レスポンス (202)

```json
{
  "success": true,
  "data": {
    "exportId": "uuid",
    "status": "processing",
    "estimatedTime": 300
  }
}
```

### 9.3 電子納品ステータス確認

```http
GET /projects/{projectId}/exports/{exportId}
```

#### レスポンス (200)

```json
{
  "success": true,
  "data": {
    "exportId": "uuid",
    "status": "completed",
    "progress": 100,
    "downloadUrl": "https://...",
    "expiresAt": "2025-12-29T00:00:00.000Z",
    "fileSize": 650000000,
    "fileCount": 1234,
    "createdAt": "2025-12-28T12:00:00.000Z",
    "completedAt": "2025-12-28T12:05:00.000Z"
  }
}
```

### 9.4 電子納品一覧

```http
GET /projects/{projectId}/exports
```

---

## 10. 帳票API

### 10.1 工事写真台帳生成

```http
POST /projects/{projectId}/reports/photo-ledger
```

#### リクエスト

```json
{
  "photoIds": ["uuid1", "uuid2"],
  "format": "pdf",
  "layout": "2x2",
  "includeBlackboard": true
}
```

#### レスポンス (202)

```json
{
  "success": true,
  "data": {
    "reportId": "uuid",
    "status": "processing"
  }
}
```

### 10.2 帳票ダウンロード

```http
GET /projects/{projectId}/reports/{reportId}/download
```

---

## 11. エラーコード一覧

| コード | 説明 |
|--------|------|
| AUTH_INVALID_CREDENTIALS | 認証情報が不正 |
| AUTH_TOKEN_EXPIRED | トークン期限切れ |
| AUTH_INSUFFICIENT_PERMISSION | 権限不足 |
| VALIDATION_ERROR | バリデーションエラー |
| RESOURCE_NOT_FOUND | リソースが見つからない |
| RESOURCE_CONFLICT | リソース競合 |
| FILE_TOO_LARGE | ファイルサイズ超過 |
| FILE_TYPE_NOT_ALLOWED | 許可されていないファイル形式 |
| RATE_LIMIT_EXCEEDED | レート制限超過 |
| INTERNAL_ERROR | 内部エラー |

---

## 12. Webhook

### 12.1 Webhook設定

```http
POST /organizations/{orgId}/webhooks
```

#### リクエスト

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["photo.created", "photo.deleted", "export.completed"],
  "secret": "webhook-secret"
}
```

### 12.2 Webhookイベント一覧

| イベント | 説明 |
|---------|------|
| photo.created | 写真が登録された |
| photo.updated | 写真が更新された |
| photo.deleted | 写真が削除された |
| export.started | 電子納品処理開始 |
| export.completed | 電子納品処理完了 |
| export.failed | 電子納品処理失敗 |

### 12.3 Webhookペイロード例

```json
{
  "event": "photo.created",
  "timestamp": "2025-12-28T12:00:00.000Z",
  "data": {
    "photoId": "uuid",
    "projectId": "uuid",
    "title": "掘削状況"
  }
}
```

---

## 変更履歴

| バージョン | 日付 | 変更内容 | 担当 |
|-----------|------|----------|------|
| 1.0.0 | 2025-12-28 | 初版作成 | System |

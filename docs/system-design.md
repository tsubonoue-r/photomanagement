# システム設計書

## 工事写真管理システム (PhotoManagement)

| 項目 | 内容 |
|------|------|
| ドキュメントID | SYS-001 |
| バージョン | 1.0.0 |
| 作成日 | 2025-12-28 |
| ステータス | Draft |

---

## 1. システム概要

### 1.1 システム構成図

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Layer                                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │   Web Browser   │  │  Mobile Safari  │  │  Mobile Chrome  │     │
│  │   (PC/Mac)      │  │    (iOS)        │  │   (Android)     │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
└───────────┼────────────────────┼────────────────────┼───────────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        CDN (Vercel Edge)                            │
└─────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Application Layer                              │
├─────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Next.js Application                        │  │
│  │  ┌─────────────────┐  ┌─────────────────┐                    │  │
│  │  │   App Router    │  │   API Routes    │                    │  │
│  │  │   (Frontend)    │  │   (Backend)     │                    │  │
│  │  │                 │  │                 │                    │  │
│  │  │  - Pages        │  │  - REST API     │                    │  │
│  │  │  - Components   │  │  - Auth Handler │                    │  │
│  │  │  - Hooks        │  │  - File Upload  │                    │  │
│  │  └─────────────────┘  └─────────────────┘                    │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
            │                    │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Layer                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │    Supabase     │  │   Cloudflare    │  │    Supabase     │     │
│  │   PostgreSQL    │  │       R2        │  │      Auth       │     │
│  │                 │  │   (Storage)     │  │                 │     │
│  │  - Users        │  │                 │  │  - JWT          │     │
│  │  - Projects     │  │  - Photos       │  │  - Sessions     │     │
│  │  - Photos       │  │  - Thumbnails   │  │  - OAuth        │     │
│  │  - Categories   │  │  - Exports      │  │                 │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 技術スタック

| レイヤー | 技術 | バージョン | 用途 |
|---------|------|-----------|------|
| Frontend | Next.js | 15.x | Webフレームワーク |
| Frontend | React | 19.x | UIライブラリ |
| Frontend | TypeScript | 5.x | 型安全な開発 |
| Frontend | Tailwind CSS | 3.x | スタイリング |
| Frontend | shadcn/ui | - | UIコンポーネント |
| Backend | Next.js API Routes | 15.x | REST API |
| Database | PostgreSQL | 15.x | データ永続化 |
| Database | Supabase | - | BaaS |
| Storage | Cloudflare R2 | - | ファイルストレージ |
| Auth | Supabase Auth | - | 認証・認可 |
| Hosting | Vercel | - | ホスティング・CDN |

---

## 2. アーキテクチャ設計

### 2.1 アプリケーションアーキテクチャ

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 認証関連ページ
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # メインアプリ
│   │   ├── projects/        # 工事一覧・詳細
│   │   ├── photos/          # 写真管理
│   │   ├── blackboard/      # 電子小黒板
│   │   ├── export/          # 電子納品
│   │   └── settings/        # 設定
│   ├── api/                 # API Routes
│   │   ├── auth/
│   │   ├── projects/
│   │   ├── photos/
│   │   ├── blackboard/
│   │   └── export/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # 基本UIコンポーネント
│   ├── features/            # 機能別コンポーネント
│   │   ├── photo/
│   │   ├── blackboard/
│   │   ├── project/
│   │   └── export/
│   └── layouts/             # レイアウトコンポーネント
├── lib/
│   ├── supabase/           # Supabaseクライアント
│   ├── storage/            # R2ストレージ
│   ├── utils/              # ユーティリティ
│   └── validators/         # バリデーション
├── hooks/                   # カスタムフック
├── types/                   # 型定義
└── styles/                  # グローバルスタイル
```

### 2.2 レイヤー構成

```
┌─────────────────────────────────────────────────────────────────┐
│                    Presentation Layer                           │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Pages       │  │  Components   │  │    Hooks      │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    Application Layer                            │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │  API Routes   │  │   Services    │  │  Validators   │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    Domain Layer                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Entities    │  │  Interfaces   │  │    Types      │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                         │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   Supabase    │  │     R2        │  │    Auth       │       │
│  └───────────────┘  └───────────────┘  └───────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. データベース設計

### 3.1 ER図

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │  organizations  │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │
│ email           │  │    │ name            │
│ name            │  │    │ created_at      │
│ avatar_url      │  │    └────────┬────────┘
│ created_at      │  │             │
└─────────────────┘  │             │
                     │             │
┌─────────────────┐  │    ┌────────▼────────┐
│ org_members     │◀─┴───▶│    projects     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ org_id (FK)     │       │ org_id (FK)     │
│ user_id (FK)    │       │ name            │
│ role            │       │ client_name     │
│ created_at      │       │ contractor_name │
└─────────────────┘       │ start_date      │
                          │ end_date        │
                          │ status          │
                          │ created_at      │
                          └────────┬────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   categories    │       │     photos      │       │ project_members │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ project_id (FK) │◀──────│ project_id (FK) │       │ project_id (FK) │
│ parent_id (FK)  │       │ category_id(FK) │──────▶│ user_id (FK)    │
│ name            │       │ title           │       │ role            │
│ type            │       │ file_path       │       │ created_at      │
│ sort_order      │       │ thumbnail_path  │       └─────────────────┘
│ created_at      │       │ taken_at        │
└─────────────────┘       │ taken_location  │
                          │ exif_data       │
                          │ blackboard_id   │───────┐
                          │ created_at      │       │
                          └─────────────────┘       │
                                                    │
                          ┌─────────────────┐       │
                          │   blackboards   │◀──────┘
                          ├─────────────────┤
                          │ id (PK)         │
                          │ project_id (FK) │
                          │ template_id     │
                          │ content         │
                          │ position        │
                          │ created_at      │
                          └─────────────────┘
```

### 3.2 テーブル定義

#### users テーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|------|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| email | varchar(255) | NO | - | メールアドレス |
| name | varchar(100) | NO | - | 表示名 |
| avatar_url | text | YES | NULL | アバター画像URL |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

#### organizations テーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|------|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| name | varchar(200) | NO | - | 組織名 |
| slug | varchar(100) | NO | - | URLスラッグ |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

#### projects テーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|------|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| org_id | uuid | NO | - | 組織ID（FK） |
| name | varchar(200) | NO | - | 工事名 |
| code | varchar(50) | YES | NULL | 工事番号 |
| client_name | varchar(200) | YES | NULL | 発注者名 |
| contractor_name | varchar(200) | YES | NULL | 請負者名 |
| location | text | YES | NULL | 工事場所 |
| start_date | date | YES | NULL | 工事開始日 |
| end_date | date | YES | NULL | 工事終了日 |
| status | varchar(20) | NO | 'active' | ステータス |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |

#### categories テーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|------|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| project_id | uuid | NO | - | 工事ID（FK） |
| parent_id | uuid | YES | NULL | 親カテゴリID |
| name | varchar(200) | NO | - | カテゴリ名 |
| type | varchar(20) | NO | - | 種別（工種/種別/細別） |
| code | varchar(10) | YES | NULL | 分類コード |
| sort_order | int | NO | 0 | 並び順 |
| created_at | timestamptz | NO | now() | 作成日時 |

#### photos テーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|------|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| project_id | uuid | NO | - | 工事ID（FK） |
| category_id | uuid | YES | NULL | カテゴリID（FK） |
| title | varchar(200) | YES | NULL | 写真タイトル |
| description | text | YES | NULL | 説明 |
| file_path | text | NO | - | 原本ファイルパス |
| thumbnail_path | text | YES | NULL | サムネイルパス |
| file_size | bigint | NO | - | ファイルサイズ |
| mime_type | varchar(50) | NO | - | MIMEタイプ |
| width | int | YES | NULL | 画像幅 |
| height | int | YES | NULL | 画像高さ |
| taken_at | timestamptz | YES | NULL | 撮影日時 |
| taken_location | jsonb | YES | NULL | 撮影位置（緯度経度） |
| exif_data | jsonb | YES | NULL | EXIF情報 |
| blackboard_id | uuid | YES | NULL | 小黒板ID（FK） |
| created_by | uuid | NO | - | 登録者ID（FK） |
| created_at | timestamptz | NO | now() | 作成日時 |
| updated_at | timestamptz | NO | now() | 更新日時 |
| deleted_at | timestamptz | YES | NULL | 削除日時 |

#### blackboards テーブル

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|------|------|-----------|------|
| id | uuid | NO | gen_random_uuid() | 主キー |
| project_id | uuid | NO | - | 工事ID（FK） |
| template_id | varchar(50) | NO | 'default' | テンプレートID |
| content | jsonb | NO | - | 小黒板内容 |
| position | varchar(20) | NO | 'bottom-right' | 合成位置 |
| size | int | NO | 30 | サイズ（%） |
| created_at | timestamptz | NO | now() | 作成日時 |

### 3.3 インデックス設計

```sql
-- photos テーブル
CREATE INDEX idx_photos_project_id ON photos(project_id);
CREATE INDEX idx_photos_category_id ON photos(category_id);
CREATE INDEX idx_photos_taken_at ON photos(taken_at);
CREATE INDEX idx_photos_created_at ON photos(created_at);
CREATE INDEX idx_photos_deleted_at ON photos(deleted_at) WHERE deleted_at IS NULL;

-- categories テーブル
CREATE INDEX idx_categories_project_id ON categories(project_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- projects テーブル
CREATE INDEX idx_projects_org_id ON projects(org_id);
CREATE INDEX idx_projects_status ON projects(status);
```

---

## 4. 認証・認可設計

### 4.1 認証フロー

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client  │    │  Next.js │    │ Supabase │    │ Database │
│          │    │   API    │    │   Auth   │    │          │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. Login      │               │               │
     │──────────────▶│               │               │
     │               │ 2. Auth       │               │
     │               │──────────────▶│               │
     │               │               │ 3. Verify     │
     │               │               │──────────────▶│
     │               │               │◀──────────────│
     │               │ 4. JWT Token  │               │
     │               │◀──────────────│               │
     │ 5. Set Cookie │               │               │
     │◀──────────────│               │               │
     │               │               │               │
     │ 6. API Request (with cookie)  │               │
     │──────────────▶│               │               │
     │               │ 7. Verify JWT │               │
     │               │──────────────▶│               │
     │               │◀──────────────│               │
     │               │ 8. Query      │               │
     │               │───────────────┼──────────────▶│
     │               │◀──────────────┼───────────────│
     │ 9. Response   │               │               │
     │◀──────────────│               │               │
```

### 4.2 権限モデル（RBAC）

```yaml
roles:
  - name: owner
    description: 組織オーナー
    permissions:
      - organization:*
      - project:*
      - member:*
      - settings:*

  - name: admin
    description: 管理者
    permissions:
      - project:*
      - member:read
      - member:invite
      - settings:read

  - name: member
    description: メンバー
    permissions:
      - project:read
      - project:update
      - photo:*
      - blackboard:*
      - export:read

  - name: viewer
    description: 閲覧者
    permissions:
      - project:read
      - photo:read
      - export:read
```

### 4.3 Row Level Security (RLS)

```sql
-- photos テーブルのRLSポリシー
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 読み取りポリシー: 同一プロジェクトのメンバーのみ
CREATE POLICY photos_select ON photos
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );

-- 挿入ポリシー: プロジェクトメンバーのみ
CREATE POLICY photos_insert ON photos
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );
```

---

## 5. ストレージ設計

### 5.1 ファイル構造

```
r2-bucket/
├── organizations/
│   └── {org_id}/
│       └── projects/
│           └── {project_id}/
│               ├── photos/
│               │   ├── originals/
│               │   │   └── {photo_id}.{ext}
│               │   └── thumbnails/
│               │       ├── {photo_id}_sm.jpg    # 150x150
│               │       ├── {photo_id}_md.jpg    # 400x400
│               │       └── {photo_id}_lg.jpg    # 800x800
│               ├── exports/
│               │   └── {export_id}/
│               │       └── PHOTO/
│               │           └── ...
│               └── temp/
│                   └── {upload_session_id}/
```

### 5.2 アップロードフロー

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client  │    │  Next.js │    │    R2    │    │ Database │
│          │    │   API    │    │          │    │          │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     │ 1. Upload Request             │               │
     │──────────────▶│               │               │
     │               │               │               │
     │ 2. Presigned URL              │               │
     │◀──────────────│               │               │
     │               │               │               │
     │ 3. Direct Upload              │               │
     │───────────────┼──────────────▶│               │
     │               │               │               │
     │ 4. Complete   │               │               │
     │──────────────▶│               │               │
     │               │ 5. Generate Thumbnails        │
     │               │──────────────▶│               │
     │               │               │               │
     │               │ 6. Save Metadata              │
     │               │───────────────┼──────────────▶│
     │               │               │               │
     │ 7. Response   │               │               │
     │◀──────────────│               │               │
```

### 5.3 画像処理

| 処理 | ツール | 設定 |
|------|--------|------|
| サムネイル生成 | Sharp | JPEG品質80% |
| EXIF読み取り | exifr | GPS、撮影日時 |
| HEIC変換 | heic-convert | JPEG出力 |
| 画像回転 | Sharp | EXIF Orientation対応 |

---

## 6. セキュリティ設計

### 6.1 セキュリティ対策一覧

| 脅威 | 対策 | 実装方法 |
|------|------|----------|
| XSS | サニタイズ | React自動エスケープ、DOMPurify |
| CSRF | トークン検証 | SameSite Cookie |
| SQLi | パラメータ化 | Supabase ORM |
| 認証突破 | JWT検証 | Supabase Auth |
| 権限昇格 | RBAC+RLS | 多層防御 |
| 情報漏洩 | 暗号化 | TLS、AES-256 |

### 6.2 セキュリティヘッダー

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; img-src 'self' data: https:; ...",
  },
];
```

---

## 7. 監視・ログ設計

### 7.1 ログ種別

| ログ種別 | 内容 | 保持期間 |
|---------|------|---------|
| アクセスログ | リクエスト情報 | 30日 |
| エラーログ | エラー詳細 | 90日 |
| 監査ログ | ユーザー操作 | 1年 |
| セキュリティログ | 認証・認可 | 1年 |

### 7.2 監視項目

| 監視対象 | メトリクス | 閾値 |
|---------|-----------|------|
| API | レスポンス時間 | p95 < 2秒 |
| API | エラー率 | < 1% |
| DB | 接続数 | < 80% |
| Storage | 使用量 | < 80% |
| Auth | ログイン失敗率 | < 5% |

---

## 8. デプロイ設計

### 8.1 デプロイフロー

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Local  │───▶│  GitHub │───▶│ Vercel  │───▶│  Prod   │
│   Dev   │    │  (main) │    │ Preview │    │         │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
     │              │              │              │
     │         PR作成・レビュー    │              │
     │              │              │              │
     │              │      プレビュー確認         │
     │              │              │              │
     │              │              │     本番デプロイ
```

### 8.2 環境構成

| 環境 | URL | 用途 |
|------|-----|------|
| Development | localhost:3000 | ローカル開発 |
| Preview | *.vercel.app | PR確認 |
| Production | photomanagement.app | 本番 |

### 8.3 環境変数

```bash
# Database
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 9. 開発ガイドライン

### 9.1 コーディング規約

- TypeScript strict mode 必須
- ESLint + Prettier による自動フォーマット
- コンポーネントは関数コンポーネント（FC）
- 状態管理は React Server Components + useState/useReducer

### 9.2 テスト戦略

| テスト種別 | ツール | カバレッジ目標 |
|-----------|--------|--------------|
| Unit | Vitest | 80% |
| Integration | Vitest | 60% |
| E2E | Playwright | 主要フロー |

### 9.3 ブランチ戦略

```
main (本番)
  └── develop (開発)
        ├── feature/xxx
        ├── fix/xxx
        └── docs/xxx
```

---

## 変更履歴

| バージョン | 日付 | 変更内容 | 担当 |
|-----------|------|----------|------|
| 1.0.0 | 2025-12-28 | 初版作成 | System |

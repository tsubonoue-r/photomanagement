# 工程写真管理システム (PhotoManagement)

建設現場の写真管理をシンプルに、確実に。工事写真の撮影から電子納品まで一貫したワークフローで管理するWebアプリケーションです。

## 概要

本システムは建設会社向けの工事写真管理ソリューションです。以下の機能を提供します：

- 工事写真の登録・管理
- 工種・種別・細別による分類整理
- 電子黒板（デジタル黒板）の合成
- 国土交通省基準準拠の電子納品出力
- 複数ユーザー・プロジェクトチーム対応
- 現場からのモバイルアクセス

## 技術スタック

| レイヤー | 技術 | 用途 |
|---------|------|------|
| フロントエンド | Next.js 16 + React 19 | Webアプリケーションフレームワーク |
| 言語 | TypeScript 5 | 型安全な開発 |
| スタイリング | Tailwind CSS 4 | ユーティリティファーストCSS |
| データベース | PostgreSQL + Prisma | データ永続化・ORM |
| ストレージ | AWS S3 / ローカル | 写真ファイル保存 |
| 認証 | NextAuth.js 5 | ユーザー認証 |
| 画像処理 | Sharp | サムネイル生成・EXIF抽出 |
| テスト | Jest + Playwright | ユニット・E2Eテスト |

## システム要件

- Node.js 20+
- PostgreSQL 15+
- npm または yarn

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/tsubonoue-r/photomanagement.git
cd photomanagement
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. 環境変数の設定

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
# データベース
DATABASE_URL="postgresql://user:password@localhost:5432/photomanagement"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# ストレージ設定
# ローカル開発用（S3不要）
STORAGE_TYPE="local"

# S3/R2使用時
# STORAGE_TYPE="s3"
# STORAGE_ENDPOINT="https://account.r2.cloudflarestorage.com"
# STORAGE_REGION="auto"
# STORAGE_ACCESS_KEY_ID="your-access-key"
# STORAGE_SECRET_ACCESS_KEY="your-secret-key"
# STORAGE_BUCKET="photos"
# STORAGE_PUBLIC_URL="https://your-public-url.example.com"
```

### 4. データベースセットアップ

```bash
# Prismaクライアント生成
npx prisma generate

# マイグレーション実行
npx prisma db push

# サンプルデータ投入（開発用）
npm run db:seed
```

### 5. 開発サーバー起動

```bash
npm run dev
```

`http://localhost:3000` でアクセス可能です。

## テストアカウント

サンプルデータ投入後、以下のアカウントで動作確認できます：

| メールアドレス | パスワード | 権限 |
|---------------|-----------|------|
| admin@example.com | password123 | 管理者 |
| manager@example.com | password123 | マネージャー |
| member@example.com | password123 | メンバー |

## プロジェクト構成

```
photomanagement/
├── prisma/
│   ├── schema.prisma         # データベーススキーマ
│   └── seed.ts               # サンプルデータ
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/           # 認証ページ
│   │   │   ├── login/        # ログイン
│   │   │   └── register/     # 新規登録
│   │   ├── (dashboard)/      # ダッシュボード（認証必須）
│   │   │   ├── dashboard/    # ダッシュボード
│   │   │   └── projects/[id]/
│   │   │       ├── photos/       # 写真一覧
│   │   │       ├── albums/       # アルバム管理
│   │   │       ├── categories/   # 工種分類
│   │   │       └── blackboard/   # 黒板設定
│   │   └── api/              # APIエンドポイント
│   ├── components/           # Reactコンポーネント
│   │   ├── albums/           # アルバム関連
│   │   ├── auth/             # 認証フォーム
│   │   ├── blackboard/       # 電子黒板
│   │   ├── categories/       # 工種分類
│   │   ├── export/           # 電子納品
│   │   └── photos/           # 写真管理
│   ├── hooks/                # カスタムReact Hooks
│   ├── lib/                  # コアライブラリ
│   │   ├── auth.ts           # 認証設定
│   │   ├── blackboard.ts     # 黒板レンダリング
│   │   ├── electronic-delivery/ # 電子納品ユーティリティ
│   │   ├── image.ts          # 画像処理
│   │   ├── prisma.ts         # Prismaクライアント
│   │   ├── storage.ts        # S3ストレージ
│   │   ├── storage-local.ts  # ローカルストレージ
│   │   └── storage-factory.ts # ストレージ切替
│   └── types/                # TypeScript型定義
├── __tests__/                # テストコード
│   ├── unit/                 # ユニットテスト
│   ├── integration/          # 統合テスト
│   └── e2e/                  # E2Eテスト
└── public/
    └── uploads/              # ローカルアップロード先
```

## 機能詳細

### 1. 認証・ユーザー管理

- メール/パスワード認証
- ロールベースアクセス制御（管理者・マネージャー・メンバー・閲覧者）
- プロジェクト単位の権限管理
- セキュアなセッション管理（JWT）

### 2. 写真管理

- ドラッグ&ドロップでアップロード
- EXIF情報の自動抽出（撮影日時、GPS、カメラ情報）
- サムネイル自動生成
- 一括アップロード対応
- 日付・カテゴリ・位置情報での検索・フィルタリング
- キーボードショートカット対応

### 3. 工種分類

- 階層型カテゴリシステム（工種 / 種別 / 細別）
- 国土交通省標準工種のインポート
- カスタムカテゴリの作成・編集
- ドラッグ&ドロップによる並び替え

### 4. 電子黒板

- デジタル黒板機能
- カスタマイズ可能なテンプレート
  - テキストフィールド
  - 日付フィールド
  - 数値フィールド
  - 選択式フィールド
  - 略図キャンバス
- 写真への黒板オーバーレイ
- テンプレートの保存・再利用

### 5. アルバム・帳票出力

- 目的別の写真アルバム作成
- 写真の選択・並び替え
- PDF形式でエクスポート
- Excel形式での台帳出力
- 印刷対応レイアウト

### 6. 電子納品

- 国土交通省基準準拠のXML生成
- 規定のファイル命名規則
- 納品仕様に準拠したディレクトリ構造
- 納品要件のバリデーション

## データベーススキーマ

### 主要エンティティ

```
Organization (組織)
  └── Project (プロジェクト)
       ├── Category (工種/種別/細別)
       ├── Photo (写真)
       ├── Blackboard (黒板)
       └── Album (アルバム)

User (ユーザー)
  ├── OrganizationMember (組織メンバー)
  └── ProjectMember (プロジェクトメンバー)
```

### ロール階層

| ロール | 権限 |
|-------|------|
| ADMIN | 全機能へのアクセス、ユーザー管理 |
| MANAGER | プロジェクト管理、メンバー招待 |
| MEMBER | 写真アップロード、編集 |
| VIEWER | 閲覧のみ |

## APIエンドポイント

### 認証

| エンドポイント | 説明 |
|---------------|------|
| `POST /api/auth/register` | ユーザー登録 |
| `POST /api/auth/[...nextauth]` | NextAuth.jsハンドラ |

### 写真

| エンドポイント | 説明 |
|---------------|------|
| `POST /api/photos/upload` | 写真アップロード |
| `GET /api/photos` | 写真一覧取得 |
| `GET /api/photos/[id]` | 写真詳細取得 |
| `PUT /api/photos/[id]` | 写真更新 |
| `DELETE /api/photos/[id]` | 写真削除 |
| `GET /api/photos/search` | 写真検索 |
| `POST /api/photos/presigned` | 署名付きURL取得 |

### 工種分類

| エンドポイント | 説明 |
|---------------|------|
| `GET /api/categories` | カテゴリ一覧 |
| `POST /api/categories` | カテゴリ作成 |
| `PUT /api/categories/[id]` | カテゴリ更新 |
| `DELETE /api/categories/[id]` | カテゴリ削除 |
| `POST /api/categories/reorder` | 並び替え |
| `POST /api/categories/import-standard` | 標準工種インポート |

### 黒板

| エンドポイント | 説明 |
|---------------|------|
| `GET /api/blackboards` | 黒板一覧 |
| `POST /api/blackboards` | 黒板作成 |
| `PUT /api/blackboards/[id]` | 黒板更新 |
| `DELETE /api/blackboards/[id]` | 黒板削除 |
| `POST /api/blackboards/compose` | 写真と黒板の合成 |

### アルバム

| エンドポイント | 説明 |
|---------------|------|
| `GET /api/albums` | アルバム一覧 |
| `POST /api/albums` | アルバム作成 |
| `PUT /api/albums/[id]` | アルバム更新 |
| `DELETE /api/albums/[id]` | アルバム削除 |
| `POST /api/albums/[id]/photos` | 写真追加 |
| `GET /api/albums/[id]/export` | エクスポート |

### 電子納品

| エンドポイント | 説明 |
|---------------|------|
| `GET /api/projects/[id]/export/electronic-delivery` | 電子納品データ出力 |

## 開発コマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 本番サーバー
npm run start

# ESLint
npm run lint

# テスト（全て）
npm run test:all

# ユニットテスト
npm run test

# E2Eテスト
npm run test:e2e

# テストカバレッジ
npm run test:coverage

# データベース
npm run db:seed      # サンプルデータ投入
npm run db:reset     # リセット＆再投入
npm run db:studio    # Prisma Studio起動
```

## テスト

### テストスイート

- **ユニットテスト**: Jest + Testing Library
- **統合テスト**: API エンドポイントのテスト
- **E2Eテスト**: Playwright

### テスト実行

```bash
# 全テスト
npm run test:all

# ユニットのみ
npm run test

# E2Eのみ
npm run test:e2e

# UIモード（E2E）
npm run test:e2e:ui
```

## アーキテクチャ決定

### なぜNext.js App Router？
- サーバーサイドレンダリングによるSEOと初期ロード性能の向上
- 単一コードベースでAPIルートを実装
- React Server Componentsによる効率的なデータ取得

### なぜPrisma？
- 型安全なデータベースクエリ
- TypeScript型の自動生成
- 簡単なマイグレーション・スキーマ管理
- PostgreSQL JSON列のサポート

### なぜS3/R2をストレージに？
- 大容量ファイルの費用対効果の高いストレージ
- CDN連携による高速な写真配信
- 署名付きURLによるセキュアなアップロード
- AWS S3とCloudflare R2の互換性

## ライセンス

MIT License

## 参考資料

- [Kuraemon](https://www.kuraemon.com/) - 本プロジェクトのインスピレーション元
- [国土交通省 電子納品ガイドライン](https://www.mlit.go.jp/) - 電子納品仕様
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

Generated with Miyabi Agent

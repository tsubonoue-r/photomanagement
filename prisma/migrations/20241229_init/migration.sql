-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "AlbumStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "password" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "client_name" TEXT,
    "location" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "parent_id" TEXT,
    "project_id" TEXT,
    "is_standard" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "medium_url" TEXT,
    "filename" TEXT NOT NULL,
    "original_name" TEXT,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "location" TEXT,
    "taken_at" TIMESTAMP(3),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "exif_data" JSONB,
    "project_id" TEXT,
    "category_id" TEXT,
    "uploaded_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blackboards" (
    "id" TEXT NOT NULL,
    "photo_id" TEXT NOT NULL,
    "construction_name" TEXT,
    "contractor" TEXT,
    "work_type" TEXT,
    "work_location" TEXT,
    "work_detail" TEXT,
    "measurement_data" JSONB,
    "date" TIMESTAMP(3),
    "weather" TEXT,
    "personnel" TEXT,
    "remarks" TEXT,
    "template_type" TEXT,
    "raw_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blackboards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "project_id" TEXT,
    "cover_photo_id" TEXT,
    "status" "AlbumStatus" NOT NULL DEFAULT 'DRAFT',
    "export_options" JSONB,
    "cover" JSONB,
    "page_layout" JSONB,
    "created_by" TEXT NOT NULL,
    "last_exported_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "album_photos" (
    "id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "photo_id" TEXT NOT NULL,
    "page_number" INTEGER,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "custom_title" TEXT,
    "caption" TEXT,
    "layout" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "album_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_name_idx" ON "projects"("name");

-- CreateIndex
CREATE INDEX "projects_code_idx" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_created_at_idx" ON "projects"("created_at");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_project_id_idx" ON "categories"("project_id");

-- CreateIndex
CREATE INDEX "categories_level_idx" ON "categories"("level");

-- CreateIndex
CREATE INDEX "categories_is_standard_idx" ON "categories"("is_standard");

-- CreateIndex
CREATE INDEX "categories_sort_order_idx" ON "categories"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "categories_project_id_code_key" ON "categories"("project_id", "code");

-- CreateIndex
CREATE INDEX "photos_project_id_idx" ON "photos"("project_id");

-- CreateIndex
CREATE INDEX "photos_category_id_idx" ON "photos"("category_id");

-- CreateIndex
CREATE INDEX "photos_uploaded_by_idx" ON "photos"("uploaded_by");

-- CreateIndex
CREATE INDEX "photos_taken_at_idx" ON "photos"("taken_at");

-- CreateIndex
CREATE INDEX "photos_created_at_idx" ON "photos"("created_at");

-- CreateIndex
CREATE INDEX "photos_project_id_category_id_idx" ON "photos"("project_id", "category_id");

-- CreateIndex
CREATE INDEX "photos_project_id_taken_at_idx" ON "photos"("project_id", "taken_at");

-- CreateIndex
CREATE UNIQUE INDEX "blackboards_photo_id_key" ON "blackboards"("photo_id");

-- CreateIndex
CREATE INDEX "blackboards_date_idx" ON "blackboards"("date");

-- CreateIndex
CREATE INDEX "blackboards_work_type_idx" ON "blackboards"("work_type");

-- CreateIndex
CREATE INDEX "blackboards_contractor_idx" ON "blackboards"("contractor");

-- CreateIndex
CREATE INDEX "albums_project_id_idx" ON "albums"("project_id");

-- CreateIndex
CREATE INDEX "albums_created_by_idx" ON "albums"("created_by");

-- CreateIndex
CREATE INDEX "albums_status_idx" ON "albums"("status");

-- CreateIndex
CREATE INDEX "albums_created_at_idx" ON "albums"("created_at");

-- CreateIndex
CREATE INDEX "album_photos_album_id_idx" ON "album_photos"("album_id");

-- CreateIndex
CREATE INDEX "album_photos_photo_id_idx" ON "album_photos"("photo_id");

-- CreateIndex
CREATE INDEX "album_photos_album_id_sort_order_idx" ON "album_photos"("album_id", "sort_order");

-- CreateIndex
CREATE INDEX "album_photos_album_id_page_number_idx" ON "album_photos"("album_id", "page_number");

-- CreateIndex
CREATE UNIQUE INDEX "album_photos_album_id_photo_id_key" ON "album_photos"("album_id", "photo_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blackboards" ADD CONSTRAINT "blackboards_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_photos" ADD CONSTRAINT "album_photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "album_photos" ADD CONSTRAINT "album_photos_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "photos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

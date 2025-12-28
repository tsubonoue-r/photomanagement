# Database Design Document

## Photo Management System Database Design

| Item | Details |
|------|---------|
| Document ID | DB-001 |
| Version | 1.0.0 |
| Created | 2025-12-28 |
| Status | Draft |
| Related Issue | #4 |

---

## 1. Overview

This document describes the database design for the Photo Management System, a construction photo management application. The database is designed using PostgreSQL with Prisma ORM.

### 1.1 Design Principles

- **Normalization**: Tables follow 3NF to reduce data redundancy
- **Soft Delete**: Photos support soft deletion for data recovery
- **Hierarchical Data**: Categories support nested structures for construction types
- **UUID Primary Keys**: All tables use UUID for primary keys for security and distributed systems support
- **Timestamps**: All tables include created_at and updated_at timestamps

---

## 2. Entity-Relationship Diagram

```
                           ┌─────────────────────┐
                           │    organizations    │
                           ├─────────────────────┤
                           │ id (PK)             │
                           │ name                │
                           │ slug                │
                           │ plan                │
                           │ created_at          │
                           │ updated_at          │
                           └─────────┬───────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           │                         │                         │
           ▼                         ▼                         ▼
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│ organization_members│   │      projects       │   │ blackboard_templates│
├─────────────────────┤   ├─────────────────────┤   ├─────────────────────┤
│ id (PK)             │   │ id (PK)             │   │ id (PK)             │
│ organization_id(FK) │   │ organization_id(FK) │   │ organization_id(FK) │
│ user_id (FK)        │   │ name                │   │ name                │
│ role                │   │ code                │   │ fields (JSON)       │
│ created_at          │   │ description         │   │ is_default          │
└─────────┬───────────┘   │ client_name         │   │ created_at          │
          │               │ contractor_name     │   └─────────┬───────────┘
          │               │ location            │             │
          │               │ start_date          │             │
          │               │ end_date            │             │
          │               │ status              │             │
          ▼               │ created_at          │             │
┌─────────────────────┐   └─────────┬───────────┘             │
│       users         │             │                         │
├─────────────────────┤             │                         │
│ id (PK)             │◀────────────┼─────────────────────────┘
│ email               │             │
│ name                │             │
│ avatar_url          │   ┌─────────┴───────────────────────────────┐
│ created_at          │   │         │                               │
│ updated_at          │   │         │                               │
└─────────┬───────────┘   │         ▼                               ▼
          │               │ ┌─────────────────────┐     ┌─────────────────────┐
          │               │ │  project_members    │     │     categories      │
          │               │ ├─────────────────────┤     ├─────────────────────┤
          │               │ │ id (PK)             │     │ id (PK)             │
          │               │ │ project_id (FK)     │     │ project_id (FK)     │
          │               │ │ user_id (FK)        │     │ parent_id (FK)      │◀──┐
          │               │ │ role                │     │ name                │   │
          │               │ │ created_at          │     │ type                │───┘
          │               │ └─────────────────────┘     │ code                │
          │               │                             │ sort_order          │
          │               │                             │ created_at          │
          │               │                             └─────────┬───────────┘
          │               │                                       │
          │               │         ┌─────────────────────────────┘
          │               │         │
          │               │         ▼
          │               │ ┌─────────────────────┐     ┌─────────────────────┐
          │               │ │      photos         │     │    blackboards      │
          │               │ ├─────────────────────┤     ├─────────────────────┤
          │               └▶│ id (PK)             │     │ id (PK)             │
          │                 │ project_id (FK)     │◀────│ project_id (FK)     │
          │                 │ category_id (FK)    │     │ template_id (FK)    │
          └────────────────▶│ created_by (FK)     │     │ content (JSON)      │
                            │ title               │     │ position            │
                            │ description         │     │ size                │
                            │ file_path           │     │ created_at          │
                            │ thumbnail_path      │◀────│ updated_at          │
                            │ file_size           │     └─────────────────────┘
                            │ mime_type           │
                            │ width, height       │
                            │ taken_at            │
                            │ taken_location(JSON)│
                            │ exif_data (JSON)    │
                            │ blackboard_id (FK)  │
                            │ created_at          │
                            │ updated_at          │
                            │ deleted_at          │
                            └─────────┬───────────┘
                                      │
                                      │
                                      ▼
                            ┌─────────────────────┐
                            │    album_photos     │
                            ├─────────────────────┤
                            │ id (PK)             │
                            │ album_id (FK)       │◀───┐
                            │ photo_id (FK)       │    │
                            │ sort_order          │    │
                            │ created_at          │    │
                            └─────────────────────┘    │
                                                       │
                            ┌─────────────────────┐    │
                            │      albums         │────┘
                            ├─────────────────────┤
                            │ id (PK)             │
                            │ project_id (FK)     │
                            │ name                │
                            │ description         │
                            │ created_at          │
                            │ updated_at          │
                            └─────────────────────┘
```

---

## 3. Table Definitions

### 3.1 organizations

Represents companies or teams using the system.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| name | varchar(200) | NO | - | Organization name |
| slug | varchar(100) | NO | - | URL-safe identifier (unique) |
| plan | enum | NO | FREE | Subscription plan |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Update timestamp |

**Plan Types:**
- `FREE` - Free tier
- `STARTER` - Starter plan
- `PROFESSIONAL` - Professional plan
- `ENTERPRISE` - Enterprise plan

### 3.2 users

Represents system users.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| email | varchar(255) | NO | - | Email address (unique) |
| name | varchar(100) | NO | - | Display name |
| avatar_url | text | YES | NULL | Avatar image URL |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Update timestamp |

### 3.3 organization_members

Junction table for organization-user relationship with roles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| organization_id | uuid | NO | - | FK to organizations |
| user_id | uuid | NO | - | FK to users |
| role | enum | NO | MEMBER | Member role |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Update timestamp |

**Organization Roles:**
- `OWNER` - Full access, can delete organization
- `ADMIN` - Can manage projects and members
- `MEMBER` - Can access and contribute to projects
- `VIEWER` - Read-only access

### 3.4 projects

Represents construction projects.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| organization_id | uuid | NO | - | FK to organizations |
| name | varchar(200) | NO | - | Project name |
| code | varchar(50) | YES | NULL | Project code/number |
| description | text | YES | NULL | Project description |
| client_name | varchar(200) | YES | NULL | Client/owner name |
| contractor_name | varchar(200) | YES | NULL | Contractor name |
| location | text | YES | NULL | Project location |
| start_date | date | YES | NULL | Project start date |
| end_date | date | YES | NULL | Project end date |
| status | enum | NO | ACTIVE | Project status |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Update timestamp |

**Project Status:**
- `ACTIVE` - Active project
- `COMPLETED` - Completed project
- `ARCHIVED` - Archived project
- `SUSPENDED` - Suspended project

### 3.5 project_members

Junction table for project-user relationship with roles.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| project_id | uuid | NO | - | FK to projects |
| user_id | uuid | NO | - | FK to users |
| role | enum | NO | MEMBER | Project role |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Update timestamp |

**Project Roles:**
- `MANAGER` - Full project access
- `MEMBER` - Can add/edit photos
- `VIEWER` - Read-only access

### 3.6 categories

Hierarchical categorization for photos (construction types).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| project_id | uuid | NO | - | FK to projects |
| parent_id | uuid | YES | NULL | FK to parent category |
| name | varchar(200) | NO | - | Category name |
| type | enum | NO | CATEGORY | Category level type |
| code | varchar(10) | YES | NULL | Classification code |
| sort_order | int | NO | 0 | Display order |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Update timestamp |

**Category Types:**
- `CONSTRUCTION_TYPE` - Top level (construction type)
- `CATEGORY` - Middle level (category)
- `SUBCATEGORY` - Bottom level (sub-category)

### 3.7 photos

Stores construction photo metadata.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| project_id | uuid | NO | - | FK to projects |
| category_id | uuid | YES | NULL | FK to categories |
| created_by | uuid | NO | - | FK to users (uploader) |
| title | varchar(200) | YES | NULL | Photo title |
| description | text | YES | NULL | Photo description |
| file_path | text | NO | - | Storage path for original |
| thumbnail_path | text | YES | NULL | Storage path for thumbnail |
| file_size | bigint | NO | - | File size in bytes |
| mime_type | varchar(50) | NO | - | MIME type |
| width | int | YES | NULL | Image width in pixels |
| height | int | YES | NULL | Image height in pixels |
| taken_at | timestamptz | YES | NULL | Photo taken timestamp |
| taken_location | jsonb | YES | NULL | GPS coordinates |
| exif_data | jsonb | YES | NULL | EXIF metadata |
| blackboard_id | uuid | YES | NULL | FK to blackboards |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Update timestamp |
| deleted_at | timestamptz | YES | NULL | Soft delete timestamp |

**JSON Structure - taken_location:**
```json
{
  "latitude": 35.6762,
  "longitude": 139.6503
}
```

**JSON Structure - exif_data:**
```json
{
  "make": "Canon",
  "model": "EOS R5",
  "focalLength": "24mm",
  "aperture": "f/8",
  "iso": 100,
  "shutterSpeed": "1/250"
}
```

### 3.8 blackboard_templates

Templates for electronic blackboards.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| organization_id | uuid | NO | - | FK to organizations |
| name | varchar(100) | NO | - | Template name |
| fields | jsonb | NO | - | Field definitions |
| is_default | boolean | NO | false | Default template flag |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Update timestamp |

**JSON Structure - fields:**
```json
{
  "fields": [
    {
      "id": "project_name",
      "label": "Project Name",
      "type": "text",
      "required": true
    },
    {
      "id": "date",
      "label": "Date",
      "type": "date",
      "required": true
    },
    {
      "id": "result",
      "label": "Result",
      "type": "select",
      "required": true,
      "options": ["Pass", "Fail", "Pending"]
    }
  ]
}
```

### 3.9 blackboards

Electronic blackboard instances attached to photos.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| project_id | uuid | NO | - | FK to projects |
| template_id | uuid | YES | NULL | FK to blackboard_templates |
| content | jsonb | NO | - | Blackboard content |
| position | enum | NO | BOTTOM_RIGHT | Overlay position |
| size | int | NO | 30 | Size percentage |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Update timestamp |

**Blackboard Positions:**
- `TOP_LEFT`
- `TOP_RIGHT`
- `BOTTOM_LEFT`
- `BOTTOM_RIGHT`

### 3.10 albums

Photo album collections.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| project_id | uuid | NO | - | FK to projects |
| name | varchar(200) | NO | - | Album name |
| description | text | YES | NULL | Album description |
| created_at | timestamptz | NO | now() | Creation timestamp |
| updated_at | timestamptz | NO | now() | Update timestamp |

### 3.11 album_photos

Junction table for album-photo relationship.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | Primary key |
| album_id | uuid | NO | - | FK to albums |
| photo_id | uuid | NO | - | FK to photos |
| sort_order | int | NO | 0 | Display order |
| created_at | timestamptz | NO | now() | Creation timestamp |

---

## 4. Index Design

### 4.1 Performance Indexes

```sql
-- organizations
CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug);

-- organization_members
CREATE INDEX idx_organization_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_organization_members_user_id ON organization_members(user_id);
CREATE UNIQUE INDEX idx_organization_members_unique ON organization_members(organization_id, user_id);

-- users
CREATE UNIQUE INDEX idx_users_email ON users(email);

-- projects
CREATE INDEX idx_projects_org_id ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);

-- project_members
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);
CREATE UNIQUE INDEX idx_project_members_unique ON project_members(project_id, user_id);

-- categories
CREATE INDEX idx_categories_project_id ON categories(project_id);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- photos
CREATE INDEX idx_photos_project_id ON photos(project_id);
CREATE INDEX idx_photos_category_id ON photos(category_id);
CREATE INDEX idx_photos_created_by ON photos(created_by);
CREATE INDEX idx_photos_blackboard_id ON photos(blackboard_id);
CREATE INDEX idx_photos_taken_at ON photos(taken_at);
CREATE INDEX idx_photos_created_at ON photos(created_at);
CREATE INDEX idx_photos_deleted_at ON photos(deleted_at);

-- blackboard_templates
CREATE INDEX idx_blackboard_templates_org_id ON blackboard_templates(organization_id);

-- blackboards
CREATE INDEX idx_blackboards_project_id ON blackboards(project_id);
CREATE INDEX idx_blackboards_template_id ON blackboards(template_id);

-- albums
CREATE INDEX idx_albums_project_id ON albums(project_id);

-- album_photos
CREATE INDEX idx_album_photos_album_id ON album_photos(album_id);
CREATE INDEX idx_album_photos_photo_id ON album_photos(photo_id);
CREATE INDEX idx_album_photos_sort_order ON album_photos(sort_order);
CREATE UNIQUE INDEX idx_album_photos_unique ON album_photos(album_id, photo_id);
```

---

## 5. Row Level Security (RLS) Policies

### 5.1 Photos Table RLS

```sql
-- Enable RLS
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- SELECT policy: Users can only view photos from projects they belong to
CREATE POLICY photos_select_policy ON photos
  FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT policy: Users can only insert photos to projects they belong to
CREATE POLICY photos_insert_policy ON photos
  FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
      AND role IN ('MANAGER', 'MEMBER')
    )
  );

-- UPDATE policy: Users can only update photos in their projects
CREATE POLICY photos_update_policy ON photos
  FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
      AND role IN ('MANAGER', 'MEMBER')
    )
  );

-- DELETE policy: Only managers can soft-delete photos
CREATE POLICY photos_delete_policy ON photos
  FOR UPDATE
  USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
      AND role = 'MANAGER'
    )
  );
```

### 5.2 Projects Table RLS

```sql
-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY projects_select_policy ON projects
  FOR SELECT
  USING (
    id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
    )
  );
```

---

## 6. Data Migration Strategy

### 6.1 Migration Commands

```bash
# Generate Prisma migration
npx prisma migrate dev --name init

# Apply migration to production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Run seed data
npx prisma db seed
```

### 6.2 Seed Configuration

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

---

## 7. Change History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-12-28 | Initial database design | System |

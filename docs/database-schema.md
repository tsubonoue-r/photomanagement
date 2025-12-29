# Database Schema Documentation

## ER Diagram

```
                                    +------------------+
                                    |   users          |
                                    +------------------+
                                    | id (PK)          |
                                    | name             |
                                    | email (UNIQUE)   |
                                    | role             |
                                    +------------------+
                                           |
              +----------------------------+----------------------------+
              |                            |                            |
              v                            v                            v
    +------------------+         +------------------+         +------------------+
    |   accounts       |         |   sessions       |         |   albums         |
    +------------------+         +------------------+         +------------------+
    | id (PK)          |         | id (PK)          |         | id (PK)          |
    | user_id (FK)     |         | user_id (FK)     |         | title            |
    | provider         |         | session_token    |         | status           |
    | type             |         | expires          |         | project_id (FK)  |
    +------------------+         +------------------+         | created_by (FK)  |
                                                              +------------------+
                                                                     |
                                                                     v
    +------------------+         +------------------+         +------------------+
    |   projects       |         |   categories     |         |   album_photos   |
    +------------------+         +------------------+         +------------------+
    | id (PK)          |<------->| id (PK)          |         | id (PK)          |
    | name             |         | name             |         | album_id (FK)    |
    | code (UNIQUE)    |         | code             |         | photo_id (FK)    |
    | status           |         | level            |         | sort_order       |
    | client_name      |         | parent_id (FK)   |         | page_number      |
    | location         |         | project_id (FK)  |         +------------------+
    | start_date       |         | is_standard      |                ^
    | end_date         |         +------------------+                |
    +------------------+                |                            |
           |                            v                            |
           |                   +------------------+                  |
           +------------------>|   photos         |<-----------------+
                               +------------------+
                               | id (PK)          |
                               | title            |
                               | url              |
                               | filename         |
                               | project_id (FK)  |
                               | category_id (FK) |
                               | uploaded_by (FK) |
                               +------------------+
                                       |
                                       v
                               +------------------+
                               |   blackboards    |
                               +------------------+
                               | id (PK)          |
                               | photo_id (FK)    |
                               | construction_name|
                               | contractor       |
                               | work_type        |
                               | date             |
                               +------------------+
```

## Tables Overview

### Core Tables

| Table | Description | Primary Key |
|-------|-------------|-------------|
| users | User accounts and authentication | id (cuid) |
| projects | Construction projects | id (cuid) |
| categories | Photo categories (hierarchical) | id (cuid) |
| photos | Photo records with metadata | id (cuid) |
| blackboards | Construction blackboard data | id (cuid) |
| albums | Photo album collections | id (cuid) |
| album_photos | Album-Photo junction table | id (cuid) |

### Authentication Tables (NextAuth.js)

| Table | Description |
|-------|-------------|
| accounts | OAuth provider accounts |
| sessions | Active user sessions |
| verification_tokens | Email verification tokens |

## Table Definitions

### users

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, NOT NULL | Primary key (cuid) |
| name | TEXT | | User display name |
| email | TEXT | UNIQUE, NOT NULL | Email address |
| email_verified | TIMESTAMP | | Email verification date |
| password | TEXT | | Hashed password |
| image | TEXT | | Profile image URL |
| role | Role | NOT NULL, DEFAULT 'MEMBER' | User role (ADMIN/MANAGER/MEMBER/VIEWER) |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### projects

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, NOT NULL | Primary key (cuid) |
| name | TEXT | NOT NULL | Project name |
| code | TEXT | UNIQUE | Project code (e.g., PRJ-2024-001) |
| description | TEXT | | Project description |
| status | ProjectStatus | NOT NULL, DEFAULT 'ACTIVE' | Status (DRAFT/ACTIVE/COMPLETED/ARCHIVED) |
| client_name | TEXT | | Client name |
| location | TEXT | | Project location |
| start_date | TIMESTAMP | | Project start date |
| end_date | TIMESTAMP | | Project end date |
| metadata | JSONB | | Additional metadata |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### categories

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, NOT NULL | Primary key (cuid) |
| name | TEXT | NOT NULL | Category name |
| code | TEXT | UNIQUE per project | Category code |
| description | TEXT | | Category description |
| level | INTEGER | NOT NULL, DEFAULT 0 | Hierarchy level |
| parent_id | TEXT | FK -> categories.id | Parent category |
| project_id | TEXT | FK -> projects.id | Associated project |
| is_standard | BOOLEAN | NOT NULL, DEFAULT false | Template category flag |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### photos

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, NOT NULL | Primary key (cuid) |
| title | TEXT | NOT NULL | Photo title |
| description | TEXT | | Photo description |
| url | TEXT | NOT NULL | Original image URL |
| thumbnail_url | TEXT | | Thumbnail URL |
| medium_url | TEXT | | Medium-sized image URL |
| filename | TEXT | NOT NULL | Stored filename |
| original_name | TEXT | | Original upload filename |
| mime_type | TEXT | NOT NULL | MIME type |
| file_size | INTEGER | NOT NULL | File size in bytes |
| width | INTEGER | | Image width |
| height | INTEGER | | Image height |
| location | TEXT | | Location description |
| taken_at | TIMESTAMP | | Photo taken date |
| latitude | DOUBLE | | GPS latitude |
| longitude | DOUBLE | | GPS longitude |
| exif_data | JSONB | | EXIF metadata |
| project_id | TEXT | FK -> projects.id | Associated project |
| category_id | TEXT | FK -> categories.id | Associated category |
| uploaded_by | TEXT | FK -> users.id, NOT NULL | Uploader user |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### blackboards

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, NOT NULL | Primary key (cuid) |
| photo_id | TEXT | FK -> photos.id, UNIQUE | Associated photo |
| construction_name | TEXT | | Project/construction name |
| contractor | TEXT | | Contractor name |
| work_type | TEXT | | Type of work |
| work_location | TEXT | | Specific location |
| work_detail | TEXT | | Work details |
| measurement_data | JSONB | | Measurements data |
| date | TIMESTAMP | | Date on blackboard |
| weather | TEXT | | Weather condition |
| personnel | TEXT | | Workers present |
| remarks | TEXT | | Additional remarks |
| template_type | TEXT | | Blackboard template type |
| raw_data | JSONB | | Raw OCR/parsed data |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### albums

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, NOT NULL | Primary key (cuid) |
| title | TEXT | NOT NULL | Album title |
| name | TEXT | NOT NULL | Display name |
| description | TEXT | | Album description |
| project_id | TEXT | FK -> projects.id | Associated project |
| cover_photo_id | TEXT | | Cover photo ID |
| status | AlbumStatus | NOT NULL, DEFAULT 'DRAFT' | Status (DRAFT/PUBLISHED/ARCHIVED) |
| export_options | JSONB | | PDF/print export settings |
| cover | JSONB | | Cover page design |
| page_layout | JSONB | | Page layout settings |
| created_by | TEXT | FK -> users.id, NOT NULL | Creator user |
| last_exported_at | TIMESTAMP | | Last export date |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### album_photos

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PK, NOT NULL | Primary key (cuid) |
| album_id | TEXT | FK -> albums.id, NOT NULL | Associated album |
| photo_id | TEXT | FK -> photos.id, NOT NULL | Associated photo |
| page_number | INTEGER | | Page number in album |
| sort_order | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| custom_title | TEXT | | Custom title in album |
| caption | TEXT | | Photo caption |
| layout | JSONB | | Layout settings |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

## Enums

### Role
- `ADMIN` - Administrator with full access
- `MANAGER` - Project manager with elevated permissions
- `MEMBER` - Standard team member
- `VIEWER` - Read-only access

### ProjectStatus
- `DRAFT` - Project in draft state
- `ACTIVE` - Active project
- `COMPLETED` - Completed project
- `ARCHIVED` - Archived project

### AlbumStatus
- `DRAFT` - Album in draft state
- `PUBLISHED` - Published album
- `ARCHIVED` - Archived album

## Indexes

### Performance Indexes

| Table | Index Name | Columns | Purpose |
|-------|------------|---------|---------|
| users | users_email_idx | email | Fast email lookup |
| users | users_role_idx | role | Role-based queries |
| projects | projects_status_idx | status | Status filtering |
| projects | projects_name_idx | name | Name search |
| projects | projects_code_idx | code | Code lookup |
| projects | projects_created_at_idx | created_at | Date sorting |
| categories | categories_parent_id_idx | parent_id | Hierarchy navigation |
| categories | categories_project_id_idx | project_id | Project filtering |
| categories | categories_level_idx | level | Level filtering |
| photos | photos_project_id_idx | project_id | Project filtering |
| photos | photos_category_id_idx | category_id | Category filtering |
| photos | photos_uploaded_by_idx | uploaded_by | Uploader filtering |
| photos | photos_taken_at_idx | taken_at | Date filtering |
| photos | photos_project_id_category_id_idx | project_id, category_id | Combined filtering |
| photos | photos_project_id_taken_at_idx | project_id, taken_at | Project date queries |
| blackboards | blackboards_date_idx | date | Date filtering |
| blackboards | blackboards_work_type_idx | work_type | Work type filtering |
| albums | albums_project_id_idx | project_id | Project filtering |
| albums | albums_created_by_idx | created_by | Creator filtering |
| albums | albums_status_idx | status | Status filtering |
| album_photos | album_photos_album_id_idx | album_id | Album filtering |
| album_photos | album_photos_album_id_sort_order_idx | album_id, sort_order | Ordered photo retrieval |

## Relationships

### One-to-Many
- User -> Accounts (one user has many OAuth accounts)
- User -> Sessions (one user has many sessions)
- User -> Photos (one user uploads many photos)
- User -> Albums (one user creates many albums)
- Project -> Categories (one project has many categories)
- Project -> Photos (one project has many photos)
- Project -> Albums (one project has many albums)
- Category -> Photos (one category has many photos)
- Category -> Categories (self-referential hierarchy)
- Album -> AlbumPhotos (one album has many album_photos)

### One-to-One
- Photo -> Blackboard (one photo has one blackboard)

### Many-to-Many (via junction table)
- Albums <-> Photos (via album_photos)

## Cascade Delete Rules

| Parent Table | Child Table | On Delete |
|--------------|-------------|-----------|
| users | accounts | CASCADE |
| users | sessions | CASCADE |
| users | photos | RESTRICT (required uploader) |
| users | albums | RESTRICT (required creator) |
| projects | categories | CASCADE |
| projects | photos | SET NULL |
| projects | albums | SET NULL |
| categories | photos | SET NULL |
| categories | categories (children) | SET NULL |
| photos | blackboards | CASCADE |
| albums | album_photos | CASCADE |
| photos | album_photos | CASCADE |

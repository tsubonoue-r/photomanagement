# System Architecture Document

## PhotoManagement System - Technical Architecture

| Item | Description |
|------|-------------|
| Document ID | ARCH-001 |
| Version | 1.0.0 |
| Created | 2025-12-29 |
| Status | Active |

---

## 1. System Overview

### 1.1 Architecture Diagram

```
+------------------------------------------------------------------+
|                         Client Layer                              |
+------------------------------------------------------------------+
|  +-----------------+  +-----------------+  +-----------------+    |
|  |   Web Browser   |  |  Mobile Safari  |  |  Mobile Chrome  |    |
|  |   (PC/Mac)      |  |    (iOS)        |  |   (Android)     |    |
|  +--------+--------+  +--------+--------+  +--------+--------+    |
+-----------|--------------------|---------------------|-----------+
            |                    |                     |
            v                    v                     v
+------------------------------------------------------------------+
|                        CDN (Vercel Edge)                          |
+------------------------------------------------------------------+
            |
            v
+------------------------------------------------------------------+
|                      Application Layer                            |
+------------------------------------------------------------------+
|  +-------------------------------------------------------------+  |
|  |                    Next.js Application                      |  |
|  |  +-------------------------+  +-------------------------+   |  |
|  |  |       App Router        |  |      API Routes         |   |  |
|  |  |       (Frontend)        |  |      (Backend)          |   |  |
|  |  |                         |  |                         |   |  |
|  |  |  - Server Components    |  |  - REST API             |   |  |
|  |  |  - Client Components    |  |  - Auth Handler         |   |  |
|  |  |  - Custom Hooks         |  |  - File Upload          |   |  |
|  |  +-------------------------+  +-------------------------+   |  |
|  +-------------------------------------------------------------+  |
+------------------------------------------------------------------+
            |                    |
            v                    v
+------------------------------------------------------------------+
|                        Data Layer                                 |
+------------------------------------------------------------------+
|  +-----------------+  +-----------------+  +-----------------+    |
|  |   PostgreSQL    |  |   Cloudflare    |  |   NextAuth.js   |    |
|  |   (Supabase)    |  |       R2        |  |     (Auth)      |    |
|  |                 |  |   (Storage)     |  |                 |    |
|  |  - Users        |  |                 |  |  - JWT          |    |
|  |  - Projects     |  |  - Photos       |  |  - Sessions     |    |
|  |  - Photos       |  |  - Thumbnails   |  |  - OAuth        |    |
|  |  - Categories   |  |  - Exports      |  |                 |    |
|  +-----------------+  +-----------------+  +-----------------+    |
+------------------------------------------------------------------+
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | Next.js | 16.x | Web framework |
| Frontend | React | 19.x | UI library |
| Frontend | TypeScript | 5.x | Type safety |
| Frontend | Tailwind CSS | 4.x | Styling |
| Backend | Next.js API Routes | 16.x | REST API |
| Database | PostgreSQL | 15.x | Data storage |
| Database | Prisma | 5.x | ORM |
| Storage | Cloudflare R2 / AWS S3 | - | File storage |
| Auth | NextAuth.js | 5.x | Authentication |
| Hosting | Vercel | - | Deployment |

---

## 2. Application Architecture

### 2.1 Directory Structure

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # Auth pages (public)
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/          # Dashboard pages (protected)
│   │   └── projects/
│   │       └── [id]/
│   │           ├── albums/
│   │           ├── categories/
│   │           └── photos/
│   ├── api/                  # API Routes
│   │   ├── auth/
│   │   ├── blackboards/
│   │   ├── blackboard-templates/
│   │   └── photos/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── albums/               # Album components
│   ├── auth/                 # Auth forms
│   ├── blackboard/           # Blackboard components
│   ├── categories/           # Category management
│   ├── export/               # Export components
│   └── photos/               # Photo components
├── hooks/                    # Custom hooks
├── lib/                      # Core libraries
│   ├── auth.ts
│   ├── blackboard.ts
│   ├── electronic-delivery/
│   ├── image.ts
│   ├── prisma.ts
│   └── storage.ts
└── types/                    # TypeScript types
```

### 2.2 Layer Architecture

```
+---------------------------------------------------------------+
|                    Presentation Layer                          |
|  +---------------+  +---------------+  +---------------+       |
|  |    Pages      |  |  Components   |  |    Hooks      |       |
|  +---------------+  +---------------+  +---------------+       |
+---------------------------------------------------------------+
                              |
+---------------------------------------------------------------+
|                    Application Layer                           |
|  +---------------+  +---------------+  +---------------+       |
|  |  API Routes   |  |   Services    |  |  Validators   |       |
|  +---------------+  +---------------+  +---------------+       |
+---------------------------------------------------------------+
                              |
+---------------------------------------------------------------+
|                    Domain Layer                                |
|  +---------------+  +---------------+  +---------------+       |
|  |   Entities    |  |  Interfaces   |  |    Types      |       |
|  +---------------+  +---------------+  +---------------+       |
+---------------------------------------------------------------+
                              |
+---------------------------------------------------------------+
|                    Infrastructure Layer                        |
|  +---------------+  +---------------+  +---------------+       |
|  |    Prisma     |  |   S3/R2       |  | NextAuth.js   |       |
|  +---------------+  +---------------+  +---------------+       |
+---------------------------------------------------------------+
```

---

## 3. Database Design

### 3.1 Entity Relationship Diagram

```
+----------------+        +-------------------+
|     User       |        |   Organization    |
+----------------+        +-------------------+
| id             |---+    | id                |
| email          |   |    | name              |
| name           |   |    | slug              |
| password       |   |    | plan              |
+----------------+   |    +-------------------+
        |            |            |
        |            +-----+------+
        v                  v
+-------------------+  +-------------------+
| ProjectMember     |  |     Project       |
+-------------------+  +-------------------+
| id                |  | id                |
| projectId     ----+->| organizationId    |
| userId            |  | name              |
| role              |  | status            |
+-------------------+  +-------------------+
                                |
         +----------------------+----------------------+
         |                      |                      |
         v                      v                      v
+----------------+     +----------------+     +----------------+
|    Category    |     |     Photo      |     |   Blackboard   |
+----------------+     +----------------+     +----------------+
| id             |<-+  | id             |     | id             |
| projectId      |  |  | projectId      |     | projectId      |
| parentId    ---+  +--| categoryId     |     | templateId     |
| name           |     | blackboardId --+---->| content        |
| level          |     | title          |     | position       |
+----------------+     | filePath       |     +----------------+
                       +----------------+
                              |
                              v
                       +----------------+
                       |   AlbumPhoto   |
                       +----------------+
                       | albumId        |
                       | photoId        |
                       | sortOrder      |
                       +----------------+
```

### 3.2 Core Models

| Model | Description |
|-------|-------------|
| User | System users with authentication |
| Organization | Company or team container |
| Project | Construction projects |
| Category | Hierarchical photo classification |
| Photo | Uploaded construction photos |
| Blackboard | Electronic signboard data |
| BlackboardTemplate | Reusable blackboard templates |
| Album | Photo collections for export |

---

## 4. Security Architecture

### 4.1 Authentication Flow

```
+--------+     +------------+     +------------+
| Client | --> | NextAuth   | --> | Database   |
+--------+     +------------+     +------------+
    |               |                   |
    |  1. Login     |                   |
    +-------------->|                   |
    |               |  2. Verify        |
    |               +------------------>|
    |               |                   |
    |               |  3. User Data     |
    |               |<------------------+
    |               |                   |
    |  4. JWT Token |                   |
    |<--------------+                   |
```

### 4.2 Authorization Roles

| Role | Permissions |
|------|-------------|
| ADMIN | Full system access |
| MANAGER | Project and user management |
| MEMBER | Photo upload, edit own photos |
| VIEWER | Read-only access |

---

## 5. File Storage Architecture

### 5.1 Storage Structure

```
bucket/
├── photos/
│   ├── originals/
│   │   └── {photoId}.{ext}
│   └── thumbnails/
│       ├── small/
│       └── large/
└── exports/
    └── {projectId}/
```

---

## 6. Performance & Scalability

### 6.1 Optimization Strategies

| Strategy | Implementation |
|----------|----------------|
| Image Optimization | Sharp for thumbnail generation |
| Lazy Loading | React.lazy for components |
| CDN | Vercel Edge for static assets |
| Database Indexing | Prisma indexes |
| Caching | React Query |

---

Document Version: 1.0.0
Last Updated: 2025-12-29

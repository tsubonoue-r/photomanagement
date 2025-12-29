# PhotoManagement - Construction Photo Management System

A comprehensive web application for managing construction site photographs, inspired by Kuraemon. Built with Next.js, TypeScript, and modern web technologies.

## Overview

PhotoManagement provides a complete solution for construction companies to:

- Register and manage construction photos
- Organize photos by construction type, category, and subcategory
- Add electronic blackboard (digital signboard) information to photos
- Export photos in government-compliant electronic delivery formats
- Support multiple users and project teams
- Access from mobile devices on construction sites

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Next.js 16 + React 19 | Web application framework |
| Language | TypeScript 5 | Type-safe development |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| Database | PostgreSQL + Prisma | Data persistence & ORM |
| Storage | AWS S3 / Cloudflare R2 | Photo file storage |
| Authentication | NextAuth.js 5 | User authentication |
| Image Processing | Sharp | Thumbnail generation & EXIF extraction |

## Project Structure

```
photomanagement/
├── prisma/
│   └── schema.prisma           # Database schema
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication pages
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   │   └── projects/
│   │   │       └── [id]/
│   │   │           ├── albums/
│   │   │           ├── categories/
│   │   │           └── photos/
│   │   ├── api/                # API Routes
│   │   │   ├── auth/
│   │   │   ├── blackboards/
│   │   │   ├── blackboard-templates/
│   │   │   └── photos/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── albums/             # Album management components
│   │   ├── auth/               # Authentication forms
│   │   ├── blackboard/         # Electronic blackboard components
│   │   ├── categories/         # Category management
│   │   ├── export/             # Electronic delivery export
│   │   └── photos/             # Photo management components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Core libraries
│   │   ├── auth.ts             # Authentication configuration
│   │   ├── blackboard.ts       # Blackboard rendering logic
│   │   ├── electronic-delivery/ # Electronic delivery utilities
│   │   ├── image.ts            # Image processing utilities
│   │   ├── prisma.ts           # Prisma client
│   │   └── storage.ts          # S3/R2 storage client
│   └── types/                  # TypeScript type definitions
│       ├── album.ts
│       ├── blackboard.ts
│       ├── category.ts
│       ├── electronic-delivery.ts
│       ├── next-auth.d.ts
│       └── photo.ts
├── docs/                       # Documentation
├── package.json
└── tsconfig.json
```

## Features

### 1. Photo Management (Issue #6, #9)
- Upload construction photos with EXIF data extraction
- Generate optimized thumbnails automatically
- Batch upload and management
- Photo search and filtering by date, category, location

### 2. Category Management (Issue #7)
- Hierarchical category system (Construction Type / Category / Subcategory)
- Import standard categories from MLIT (Ministry of Land, Infrastructure, Transport and Tourism)
- Custom category creation and organization
- Drag-and-drop category reordering

### 3. Electronic Blackboard (Issue #8)
- Digital signboard functionality
- Customizable templates with multiple field types:
  - Text fields
  - Date fields
  - Number fields
  - Select dropdowns
  - Sketch canvas for drawings
- Overlay blackboard on photos
- Save and reuse templates

### 4. Album & Report Export (Issue #10)
- Create photo albums for specific purposes
- Select and arrange photos
- Export to PDF format
- Print-ready layouts

### 5. Electronic Delivery (Issue #11)
- MLIT-compliant XML generation
- Proper file naming conventions
- Directory structure according to specifications
- Validation against delivery requirements

### 6. Authentication & Authorization (Issue #5)
- Email/password authentication
- Role-based access control (Admin, Manager, Member, Viewer)
- Project-level permissions
- Secure session management

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Supabase account)
- AWS S3 or Cloudflare R2 bucket

### Installation

1. Clone the repository:
```bash
git clone https://github.com/tsubonoue-r/photomanagement.git
cd photomanagement
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure the `.env` file:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/photomanagement"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Storage (S3/R2)
STORAGE_ENDPOINT="https://account.r2.cloudflarestorage.com"
STORAGE_REGION="auto"
STORAGE_ACCESS_KEY_ID="your-access-key"
STORAGE_SECRET_ACCESS_KEY="your-secret-key"
STORAGE_BUCKET="photos"
STORAGE_PUBLIC_URL="https://your-public-url.example.com"
```

5. Set up the database:
```bash
npx prisma generate
npx prisma migrate dev
```

6. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

## Related Issues

This project is organized into the following sub-issues:

- [ ] #3 Requirements & System Design
- [ ] #4 Database Design
- [ ] #5 Authentication & User Management
- [ ] #6 Photo Upload & Storage
- [ ] #7 Construction Type & Category Management
- [ ] #8 Electronic Blackboard
- [ ] #9 Photo List & Search
- [ ] #10 Album & Report Export
- [ ] #11 Electronic Delivery Support

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Photos
- `POST /api/photos/upload` - Upload photos
- `GET /api/photos/[id]` - Get photo details
- `PUT /api/photos/[id]` - Update photo
- `DELETE /api/photos/[id]` - Delete photo

### Blackboards
- `GET /api/blackboards` - List blackboards
- `POST /api/blackboards` - Create blackboard
- `PUT /api/blackboards/[id]` - Update blackboard
- `DELETE /api/blackboards/[id]` - Delete blackboard

### Templates
- `GET /api/blackboard-templates` - List templates
- `POST /api/blackboard-templates` - Create template
- `PUT /api/blackboard-templates/[id]` - Update template
- `DELETE /api/blackboard-templates/[id]` - Delete template

## Development

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Database Migrations

```bash
npx prisma migrate dev      # Create and apply migrations (development)
npx prisma migrate deploy   # Apply migrations (production)
npx prisma studio           # Open Prisma Studio GUI
```

## Architecture Decisions

### Why Next.js App Router?
- Server-side rendering for better SEO and initial load performance
- API Routes for backend functionality in a single codebase
- React Server Components for efficient data fetching

### Why Prisma?
- Type-safe database queries
- Auto-generated TypeScript types
- Easy migrations and schema management
- Support for PostgreSQL JSON columns

### Why S3/R2 for Storage?
- Cost-effective large file storage
- CDN integration for fast photo delivery
- Pre-signed URLs for secure uploads
- Compatibility between AWS S3 and Cloudflare R2

## Contributing

1. Create a feature branch from `main`
2. Implement your changes
3. Write/update tests as needed
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## References

- [Kuraemon](https://www.kuraemon.com/) - Inspiration for this project
- [MLIT Electronic Delivery Guidelines](https://www.mlit.go.jp/) - Electronic delivery specifications
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

Generated with Miyabi Agent

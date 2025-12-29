/**
 * Photo List API Endpoint
 * GET: Fetch photos with filters, sorting, and pagination
 * POST: Bulk actions on photos
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  Photo,
  PhotoFilters,
  PhotoSort,
  PaginatedResponse,
  BulkActionRequest,
  BulkActionResponse,
  WorkType,
  PhotoCategory,
} from '@/types/photo';

// Mock data for development
const mockPhotos: Photo[] = Array.from({ length: 50 }, (_, i) => ({
  id: `photo-${String(i + 1).padStart(8, '0')}-0000-0000-000000000000`,
  projectId: `project-${Math.floor(i / 10) + 1}`,
  filename: `IMG_${String(i + 1).padStart(4, '0')}.jpg`,
  url: `https://picsum.photos/seed/${i + 1}/1200/800`,
  thumbnailUrl: `https://picsum.photos/seed/${i + 1}/300/200`,
  mimeType: 'image/jpeg',
  size: Math.floor(Math.random() * 5000000) + 500000,
  width: 1200,
  height: 800,
  takenAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
  uploadedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  workType: (['foundation', 'framing', 'roofing', 'exterior', 'interior', 'electrical', 'plumbing', 'finishing', 'inspection', 'other'] as WorkType[])[i % 10],
  category: (['before', 'during', 'after', 'material', 'equipment', 'defect', 'other'] as PhotoCategory[])[i % 7],
  description: `Construction photo ${i + 1}`,
  location: `Site ${Math.floor(i / 5) + 1}`,
  tags: [`tag${i % 3 + 1}`, `tag${i % 5 + 1}`],
  exif: {
    make: 'Canon',
    model: 'EOS R5',
    fNumber: 2.8,
    iso: 400,
    focalLength: 50,
  },
}));

function parseFilters(searchParams: URLSearchParams): PhotoFilters {
  const filters: PhotoFilters = {};

  const workType = searchParams.get('workType');
  if (workType) {
    filters.workType = workType.includes(',')
      ? (workType.split(',') as WorkType[])
      : (workType as WorkType);
  }

  const category = searchParams.get('category');
  if (category) {
    filters.category = category.includes(',')
      ? (category.split(',') as PhotoCategory[])
      : (category as PhotoCategory);
  }

  const dateFrom = searchParams.get('dateFrom');
  if (dateFrom) filters.dateFrom = dateFrom;

  const dateTo = searchParams.get('dateTo');
  if (dateTo) filters.dateTo = dateTo;

  const tags = searchParams.get('tags');
  if (tags) filters.tags = tags.split(',');

  const hasBlackboard = searchParams.get('hasBlackboard');
  if (hasBlackboard) filters.hasBlackboard = hasBlackboard === 'true';

  return filters;
}

function parseSort(searchParams: URLSearchParams): PhotoSort {
  return {
    field: (searchParams.get('sortField') || 'takenAt') as PhotoSort['field'],
    direction: (searchParams.get('sortOrder') || 'desc') as PhotoSort['direction'],
  };
}

function applyFilters(photos: Photo[], filters: PhotoFilters): Photo[] {
  return photos.filter((photo) => {
    if (filters.workType) {
      const workTypes = Array.isArray(filters.workType)
        ? filters.workType
        : [filters.workType];
      if (!photo.workType || !workTypes.includes(photo.workType)) {
        return false;
      }
    }

    if (filters.category) {
      const categories = Array.isArray(filters.category)
        ? filters.category
        : [filters.category];
      if (!photo.category || !categories.includes(photo.category)) {
        return false;
      }
    }

    if (filters.dateFrom && photo.takenAt) {
      if (new Date(photo.takenAt) < new Date(filters.dateFrom)) {
        return false;
      }
    }
    if (filters.dateTo && photo.takenAt) {
      if (new Date(photo.takenAt) > new Date(filters.dateTo)) {
        return false;
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      if (!filters.tags.some((tag) => photo.tags.includes(tag))) {
        return false;
      }
    }

    return true;
  });
}

function applySort(photos: Photo[], sort: PhotoSort): Photo[] {
  return [...photos].sort((a, b) => {
    let comparison = 0;

    switch (sort.field) {
      case 'takenAt':
        const dateA = a.takenAt ? new Date(a.takenAt).getTime() : 0;
        const dateB = b.takenAt ? new Date(b.takenAt).getTime() : 0;
        comparison = dateA - dateB;
        break;
      case 'filename':
        comparison = a.filename.localeCompare(b.filename);
        break;
      case 'uploadedAt':
        comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
    }

    return sort.direction === 'asc' ? comparison : -comparison;
  });
}

/**
 * GET /api/photos
 * Get photos with filters, sorting, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const filters = parseFilters(searchParams);
    const sort = parseSort(searchParams);

    let filteredPhotos = projectId
      ? mockPhotos.filter((p) => p.projectId === projectId)
      : mockPhotos;

    filteredPhotos = applyFilters(filteredPhotos, filters);
    filteredPhotos = applySort(filteredPhotos, sort);

    const total = filteredPhotos.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedPhotos = filteredPhotos.slice(offset, offset + limit);

    const response: PaginatedResponse<Photo> = {
      data: paginatedPhotos,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching photos:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_ERROR',
          message: 'Failed to fetch photos',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/photos
 * Bulk actions on photos
 */
export async function POST(request: NextRequest) {
  try {
    const body: BulkActionRequest = await request.json();
    const { action, photoIds, payload } = body;

    if (!photoIds || photoIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'No photo IDs provided',
          },
        },
        { status: 400 }
      );
    }

    const response: BulkActionResponse = {
      success: true,
      affectedCount: photoIds.length,
      errors: [],
    };

    switch (action) {
      case 'delete':
        console.log(`Deleting ${photoIds.length} photos`);
        break;

      case 'move':
        if (!payload?.targetProjectId) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_REQUEST',
                message: 'Target project ID is required for move action',
              },
            },
            { status: 400 }
          );
        }
        console.log(`Moving ${photoIds.length} photos to project ${payload.targetProjectId}`);
        break;

      case 'updateWorkType':
        if (!payload?.workType) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_REQUEST',
                message: 'Work type is required',
              },
            },
            { status: 400 }
          );
        }
        console.log(`Updating work type to ${payload.workType} for ${photoIds.length} photos`);
        break;

      case 'updateCategory':
        if (!payload?.category) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_REQUEST',
                message: 'Category is required',
              },
            },
            { status: 400 }
          );
        }
        console.log(`Updating category to ${payload.category} for ${photoIds.length} photos`);
        break;

      case 'addTags':
      case 'removeTags':
        if (!payload?.tags || payload.tags.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_REQUEST',
                message: 'Tags are required',
              },
            },
            { status: 400 }
          );
        }
        console.log(`${action === 'addTags' ? 'Adding' : 'Removing'} tags ${payload.tags.join(', ')} for ${photoIds.length} photos`);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: `Unknown action: ${action}`,
            },
          },
          { status: 400 }
        );
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error processing bulk action:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BULK_ACTION_ERROR',
          message: 'Failed to process bulk action',
        },
      },
      { status: 500 }
    );
  }
}

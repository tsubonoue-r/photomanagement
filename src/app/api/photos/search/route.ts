/**
 * Photo Search API Endpoint
 * Provides full-text search with highlighting
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  Photo,
  PhotoFilters,
  PaginatedResponse,
  SearchResult,
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
  description: [
    'Foundation work progress',
    'Steel frame assembly',
    'Roof waterproofing',
    'Exterior siding',
    'Interior finishing',
    'Electrical wiring',
    'Plumbing installation',
    'Final inspection',
    'Site overview',
    'Material delivery',
  ][i % 10],
  location: `Site ${Math.floor(i / 5) + 1}`,
  tags: ['construction', 'progress', `tag${i % 3 + 1}`],
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

  return filters;
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

function calculateRelevanceScore(photo: Photo, query: string): number {
  let score = 0;
  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(Boolean);

  for (const term of terms) {
    if (photo.filename.toLowerCase().includes(term)) score += 10;
    if (photo.description?.toLowerCase().includes(term)) score += 15;
    if (photo.location?.toLowerCase().includes(term)) score += 8;
    if (photo.tags.some((tag) => tag.toLowerCase().includes(term))) score += 5;
    if (photo.workType?.toLowerCase().includes(term)) score += 3;
    if (photo.category?.toLowerCase().includes(term)) score += 3;
  }

  return score;
}

function generateHighlights(
  photo: Photo,
  query: string
): { field: string; matches: string[] }[] {
  const highlights: { field: string; matches: string[] }[] = [];
  const lowerQuery = query.toLowerCase();
  const terms = lowerQuery.split(/\s+/).filter(Boolean);

  const createHighlightedSnippet = (text: string): string => {
    let result = text;
    for (const term of terms) {
      const regex = new RegExp(`(${term})`, 'gi');
      result = result.replace(regex, '<mark>$1</mark>');
    }
    return result.length > 100 ? result.slice(0, 100) + '...' : result;
  };

  if (photo.description && terms.some((term) => photo.description!.toLowerCase().includes(term))) {
    highlights.push({
      field: 'description',
      matches: [createHighlightedSnippet(photo.description)],
    });
  }
  if (photo.filename && terms.some((term) => photo.filename.toLowerCase().includes(term))) {
    highlights.push({
      field: 'filename',
      matches: [createHighlightedSnippet(photo.filename)],
    });
  }
  if (photo.location && terms.some((term) => photo.location!.toLowerCase().includes(term))) {
    highlights.push({
      field: 'location',
      matches: [createHighlightedSnippet(photo.location)],
    });
  }
  const matchingTags = photo.tags.filter((tag) =>
    terms.some((term) => tag.toLowerCase().includes(term))
  );
  if (matchingTags.length > 0) {
    highlights.push({
      field: 'tags',
      matches: matchingTags.map((tag) => `<mark>${tag}</mark>`),
    });
  }

  return highlights;
}

/**
 * GET /api/photos/search
 * Search photos with full-text search
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get('q') || '';
    const projectId = searchParams.get('projectId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const filters = parseFilters(searchParams);

    let filteredPhotos = projectId
      ? mockPhotos.filter((p) => p.projectId === projectId)
      : mockPhotos;

    filteredPhotos = applyFilters(filteredPhotos, filters);

    if (!query.trim()) {
      const total = filteredPhotos.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedPhotos = filteredPhotos.slice(offset, offset + limit);

      const response: PaginatedResponse<SearchResult> = {
        data: paginatedPhotos.map((photo) => ({
          photo,
          score: 0,
          highlights: [],
        })),
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
    }

    const searchResults: SearchResult[] = filteredPhotos
      .map((photo) => ({
        photo,
        score: calculateRelevanceScore(photo, query),
        highlights: generateHighlights(photo, query),
      }))
      .filter((result) => result.score > 0)
      .sort((a, b) => b.score - a.score);

    const total = searchResults.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedResults = searchResults.slice(offset, offset + limit);

    const response: PaginatedResponse<SearchResult> = {
      data: paginatedResults,
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
    console.error('Error searching photos:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SEARCH_ERROR',
          message: 'Failed to search photos',
        },
      },
      { status: 500 }
    );
  }
}

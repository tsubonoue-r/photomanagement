/**
 * Album Service
 * Business logic for album management
 * Issue #10: Album and Report Output
 */

import {
  Album,
  AlbumPhoto,
  CreateAlbumInput,
  UpdateAlbumInput,
  AlbumListResponse,
  DEFAULT_EXPORT_OPTIONS,
} from '@/types/album';

// In-memory storage for demo purposes
// In production, this would use Prisma with a database
const albumStore = new Map<string, Album>();

/**
 * Generate unique ID
 */
function generateId(): string {
  return `album_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get all albums for a project
 */
export async function getAlbums(
  projectId?: string,
  page = 1,
  pageSize = 20
): Promise<AlbumListResponse> {
  const allAlbums = Array.from(albumStore.values());

  // Filter by project if specified
  const filteredAlbums = projectId
    ? allAlbums.filter((album) => album.projectId === projectId)
    : allAlbums;

  // Sort by updated date descending
  const sortedAlbums = filteredAlbums.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // Paginate
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedAlbums = sortedAlbums.slice(start, end);

  return {
    albums: paginatedAlbums,
    total: filteredAlbums.length,
    page,
    pageSize,
  };
}

/**
 * Get single album by ID
 */
export async function getAlbum(albumId: string): Promise<Album | null> {
  return albumStore.get(albumId) || null;
}

/**
 * Create new album
 */
export async function createAlbum(
  input: CreateAlbumInput,
  userId: string
): Promise<Album> {
  const now = new Date();
  const album: Album = {
    id: generateId(),
    name: input.name,
    title: input.title,
    description: input.description,
    projectId: input.projectId,
    photos: [],
    cover: {
      title: input.title,
      ...input.cover,
    },
    status: 'draft',
    exportOptions: { ...DEFAULT_EXPORT_OPTIONS },
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
  };

  albumStore.set(album.id, album);
  return album;
}

/**
 * Update album
 */
export async function updateAlbum(
  albumId: string,
  input: UpdateAlbumInput
): Promise<Album | null> {
  const album = albumStore.get(albumId);
  if (!album) {
    return null;
  }

  const updatedAlbum: Album = {
    ...album,
    ...input,
    cover: input.cover ? { ...album.cover, ...input.cover } : album.cover,
    exportOptions: input.exportOptions
      ? { ...album.exportOptions, ...input.exportOptions }
      : album.exportOptions,
    updatedAt: new Date(),
  };

  albumStore.set(albumId, updatedAlbum);
  return updatedAlbum;
}

/**
 * Delete album
 */
export async function deleteAlbum(albumId: string): Promise<boolean> {
  return albumStore.delete(albumId);
}

/**
 * Add photos to album
 */
export async function addPhotosToAlbum(
  albumId: string,
  photos: Omit<AlbumPhoto, 'order' | 'createdAt' | 'updatedAt'>[]
): Promise<Album | null> {
  const album = albumStore.get(albumId);
  if (!album) {
    return null;
  }

  const now = new Date();
  const startOrder = album.photos.length;

  const newPhotos: AlbumPhoto[] = photos.map((photo, index) => ({
    ...photo,
    order: startOrder + index,
    createdAt: now,
    updatedAt: now,
  }));

  const updatedAlbum: Album = {
    ...album,
    photos: [...album.photos, ...newPhotos],
    updatedAt: now,
  };

  albumStore.set(albumId, updatedAlbum);
  return updatedAlbum;
}

/**
 * Remove photos from album
 */
export async function removePhotosFromAlbum(
  albumId: string,
  photoIds: string[]
): Promise<Album | null> {
  const album = albumStore.get(albumId);
  if (!album) {
    return null;
  }

  const photoIdSet = new Set(photoIds);
  const remainingPhotos = album.photos
    .filter((photo) => !photoIdSet.has(photo.id))
    .map((photo, index) => ({ ...photo, order: index }));

  const updatedAlbum: Album = {
    ...album,
    photos: remainingPhotos,
    updatedAt: new Date(),
  };

  albumStore.set(albumId, updatedAlbum);
  return updatedAlbum;
}

/**
 * Reorder photos in album
 */
export async function reorderPhotos(
  albumId: string,
  photoOrders: { photoId: string; order: number }[]
): Promise<Album | null> {
  const album = albumStore.get(albumId);
  if (!album) {
    return null;
  }

  const orderMap = new Map(photoOrders.map((po) => [po.photoId, po.order]));
  const now = new Date();

  const reorderedPhotos = album.photos
    .map((photo) => ({
      ...photo,
      order: orderMap.get(photo.id) ?? photo.order,
      updatedAt: now,
    }))
    .sort((a, b) => a.order - b.order);

  const updatedAlbum: Album = {
    ...album,
    photos: reorderedPhotos,
    updatedAt: now,
  };

  albumStore.set(albumId, updatedAlbum);
  return updatedAlbum;
}

/**
 * Update album status after export
 */
export async function markAsExported(albumId: string): Promise<Album | null> {
  const album = albumStore.get(albumId);
  if (!album) {
    return null;
  }

  const updatedAlbum: Album = {
    ...album,
    status: 'exported',
    lastExportedAt: new Date(),
    updatedAt: new Date(),
  };

  albumStore.set(albumId, updatedAlbum);
  return updatedAlbum;
}

/**
 * Get album statistics
 */
export function getAlbumStats(album: Album): {
  photoCount: number;
  hasBlackboard: boolean;
  isExportable: boolean;
} {
  return {
    photoCount: album.photos.length,
    hasBlackboard: album.photos.some((p) => p.blackboardInfo),
    isExportable: album.photos.length > 0 && album.status !== 'archived',
  };
}

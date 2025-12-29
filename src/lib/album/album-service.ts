/**
 * Album Service
 * Business logic for album management
 * Issue #10: Album and Report Output
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Album,
  AlbumPhoto,
  AlbumCover,
  CreateAlbumInput,
  UpdateAlbumInput,
  ReorderPhotosInput,
} from '@/types/album';
import { DEFAULT_EXPORT_OPTIONS } from '@/types/album';

// In-memory storage (replace with database in production)
const albums: Map<string, Album> = new Map();

/**
 * Create default cover
 */
function createDefaultCover(title: string, coverInput?: Partial<AlbumCover>): AlbumCover {
  return {
    title: coverInput?.title ?? title,
    subtitle: coverInput?.subtitle,
    projectName: coverInput?.projectName,
    companyName: coverInput?.companyName,
    date: coverInput?.date ?? new Date().toISOString().split('T')[0],
    backgroundColor: coverInput?.backgroundColor ?? '#ffffff',
    logoUrl: coverInput?.logoUrl,
  };
}

/**
 * Create a new album
 */
export async function createAlbum(
  input: CreateAlbumInput,
  userId: string
): Promise<Album> {
  const now = new Date();
  const album: Album = {
    id: uuidv4(),
    name: input.name,
    title: input.title,
    description: input.description,
    projectId: input.projectId,
    photos: [],
    cover: createDefaultCover(input.title, input.cover),
    status: 'draft',
    exportOptions: { ...DEFAULT_EXPORT_OPTIONS },
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
  };

  albums.set(album.id, album);
  return album;
}

/**
 * Get album by ID
 */
export async function getAlbumById(albumId: string): Promise<Album | null> {
  return albums.get(albumId) || null;
}

/**
 * Get all albums for a user
 */
export async function getAlbums(
  userId: string,
  page = 1,
  pageSize = 20
): Promise<{ albums: Album[]; total: number }> {
  const userAlbums = Array.from(albums.values()).filter(
    (album) => album.createdBy === userId
  );

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedAlbums = userAlbums.slice(start, end);

  return {
    albums: paginatedAlbums,
    total: userAlbums.length,
  };
}

/**
 * Update an album
 */
export async function updateAlbum(
  albumId: string,
  input: UpdateAlbumInput
): Promise<Album | null> {
  const album = albums.get(albumId);
  if (!album) return null;

  const updatedAlbum: Album = {
    ...album,
    name: input.name ?? album.name,
    title: input.title ?? album.title,
    description: input.description ?? album.description,
    coverPhotoId: input.coverPhotoId ?? album.coverPhotoId,
    status: input.status ?? album.status,
    cover: input.cover ? { ...album.cover, ...input.cover } : album.cover,
    exportOptions: input.exportOptions
      ? { ...album.exportOptions, ...input.exportOptions }
      : album.exportOptions,
    updatedAt: new Date(),
  };

  albums.set(albumId, updatedAlbum);
  return updatedAlbum;
}

/**
 * Delete an album
 */
export async function deleteAlbum(albumId: string): Promise<boolean> {
  return albums.delete(albumId);
}

/**
 * Add photo to album
 */
export async function addPhotoToAlbum(
  albumId: string,
  photoUrl: string,
  title: string,
  description?: string
): Promise<AlbumPhoto | null> {
  const album = albums.get(albumId);
  if (!album) return null;

  const now = new Date();
  const newPhoto: AlbumPhoto = {
    id: uuidv4(),
    url: photoUrl,
    title,
    description,
    order: album.photos.length,
    createdAt: now,
    updatedAt: now,
  };

  album.photos.push(newPhoto);
  album.updatedAt = now;
  albums.set(albumId, album);

  return newPhoto;
}

/**
 * Remove photo from album
 */
export async function removePhotoFromAlbum(
  albumId: string,
  photoId: string
): Promise<boolean> {
  const album = albums.get(albumId);
  if (!album) return false;

  const photoIndex = album.photos.findIndex((p) => p.id === photoId);
  if (photoIndex === -1) return false;

  album.photos.splice(photoIndex, 1);

  // Re-order remaining photos
  album.photos.forEach((photo, index) => {
    photo.order = index;
  });

  album.updatedAt = new Date();
  albums.set(albumId, album);

  return true;
}

/**
 * Reorder photos in album
 */
export async function reorderPhotos(
  albumId: string,
  input: ReorderPhotosInput
): Promise<Album | null> {
  const album = albums.get(albumId);
  if (!album) return null;

  const photoMap = new Map(album.photos.map((p) => [p.id, p]));
  const reorderedPhotos: AlbumPhoto[] = [];

  for (let i = 0; i < input.photoIds.length; i++) {
    const photo = photoMap.get(input.photoIds[i]);
    if (photo) {
      photo.order = i;
      reorderedPhotos.push(photo);
    }
  }

  album.photos = reorderedPhotos;
  album.updatedAt = new Date();
  albums.set(albumId, album);

  return album;
}

/**
 * Get album with photos for export
 */
export async function getAlbumForExport(albumId: string): Promise<Album | null> {
  const album = albums.get(albumId);
  if (!album) return null;

  // Sort photos by order
  const sortedPhotos = [...album.photos].sort((a, b) => a.order - b.order);

  return {
    ...album,
    photos: sortedPhotos,
  };
}

/**
 * Mark album as exported
 */
export async function markAlbumExported(albumId: string): Promise<Album | null> {
  const album = albums.get(albumId);
  if (!album) return null;

  album.status = 'exported';
  album.lastExportedAt = new Date();
  album.updatedAt = new Date();
  albums.set(albumId, album);

  return album;
}

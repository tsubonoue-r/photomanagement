/**
 * Album Service
 * Business logic for album management with Prisma
 * Issue #10: Album and Report Output
 */

import { prisma } from '@/lib/prisma';
import type {
  Album as PrismaAlbum,
  AlbumPhoto as PrismaAlbumPhoto,
  Photo,
  AlbumStatus as PrismaAlbumStatus,
} from '@prisma/client';
import {
  Album,
  AlbumPhoto,
  CreateAlbumInput,
  UpdateAlbumInput,
  AlbumListResponse,
  DEFAULT_EXPORT_OPTIONS,
  AlbumCover,
  ExportOptions,
  AlbumStatus,
} from '@/types/album';

/**
 * Convert Prisma album status to application status
 */
function mapPrismaStatus(status: PrismaAlbumStatus): AlbumStatus {
  switch (status) {
    case 'DRAFT':
      return 'draft';
    case 'PUBLISHED':
      return 'active';
    case 'ARCHIVED':
      return 'archived';
    default:
      return 'draft';
  }
}

/**
 * Convert application status to Prisma status
 */
function mapToPrismaStatus(status: AlbumStatus): PrismaAlbumStatus {
  switch (status) {
    case 'draft':
      return 'DRAFT';
    case 'active':
    case 'ready':
    case 'exported':
      return 'PUBLISHED';
    case 'archived':
      return 'ARCHIVED';
    default:
      return 'DRAFT';
  }
}

/**
 * Convert Prisma album to application album type
 */
function mapPrismaAlbumToAlbum(
  prismaAlbum: PrismaAlbum & {
    photos?: (PrismaAlbumPhoto & { photo: Photo })[];
  }
): Album {
  const cover = (prismaAlbum.cover as AlbumCover | null) || {
    title: prismaAlbum.title,
  };
  const exportOptions =
    (prismaAlbum.exportOptions as ExportOptions | null) || DEFAULT_EXPORT_OPTIONS;

  const photos: AlbumPhoto[] = (prismaAlbum.photos || []).map((ap) => ({
    id: ap.photo.id,
    url: ap.photo.url,
    thumbnailUrl: ap.photo.thumbnailUrl || undefined,
    title: ap.customTitle || ap.photo.title,
    description: ap.caption || ap.photo.description || undefined,
    takenAt: ap.photo.takenAt || undefined,
    location: ap.photo.location || undefined,
    order: ap.sortOrder,
    createdAt: ap.createdAt,
    updatedAt: ap.updatedAt,
    blackboardInfo: undefined, // Would be fetched from photo.blackboard relation
  }));

  return {
    id: prismaAlbum.id,
    title: prismaAlbum.title,
    name: prismaAlbum.name,
    description: prismaAlbum.description || undefined,
    coverPhotoId: prismaAlbum.coverPhotoId || undefined,
    projectId: prismaAlbum.projectId || undefined,
    photos: photos.sort((a, b) => a.order - b.order),
    cover: {
      title: cover.title || prismaAlbum.title,
      subtitle: cover.subtitle,
      projectName: cover.projectName,
      companyName: cover.companyName,
      date: cover.date,
      backgroundColor: cover.backgroundColor || '#ffffff',
      logoUrl: cover.logoUrl,
    },
    status: mapPrismaStatus(prismaAlbum.status),
    exportOptions: exportOptions,
    createdAt: prismaAlbum.createdAt,
    updatedAt: prismaAlbum.updatedAt,
    createdBy: prismaAlbum.createdBy,
    lastExportedAt: prismaAlbum.lastExportedAt || undefined,
  };
}

/**
 * Get all albums for a project
 */
export async function getAlbums(
  projectId?: string,
  page = 1,
  pageSize = 20
): Promise<AlbumListResponse> {
  const where = projectId ? { projectId } : {};

  const [albums, total] = await Promise.all([
    prisma.album.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        photos: {
          include: {
            photo: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    }),
    prisma.album.count({ where }),
  ]);

  return {
    albums: albums.map(mapPrismaAlbumToAlbum),
    total,
    page,
    pageSize,
  };
}

/**
 * Get single album by ID
 */
export async function getAlbum(albumId: string): Promise<Album | null> {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: {
      photos: {
        include: {
          photo: {
            include: {
              blackboard: true,
            },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!album) {
    return null;
  }

  // Map with blackboard info
  const mappedAlbum = mapPrismaAlbumToAlbum(album);
  mappedAlbum.photos = mappedAlbum.photos.map((photo, index) => {
    const prismaPhoto = album.photos[index]?.photo;
    const blackboard = prismaPhoto?.blackboard;

    return {
      ...photo,
      blackboardInfo: blackboard
        ? {
            projectName: blackboard.constructionName || undefined,
            constructionType: blackboard.workType || undefined,
            contractor: blackboard.contractor || undefined,
            photographerName: blackboard.personnel || undefined,
            date: blackboard.date || undefined,
            memo: blackboard.remarks || undefined,
          }
        : undefined,
    };
  });

  return mappedAlbum;
}

/**
 * Create new album
 */
export async function createAlbum(
  input: CreateAlbumInput,
  userId: string
): Promise<Album> {
  const album = await prisma.album.create({
    data: {
      title: input.title,
      name: input.name || input.title,
      description: input.description,
      projectId: input.projectId,
      createdBy: userId,
      status: 'DRAFT',
      cover: input.cover
        ? JSON.parse(JSON.stringify({
            title: input.cover.title || input.title,
            subtitle: input.cover.subtitle,
            projectName: input.cover.projectName,
            companyName: input.cover.companyName,
            date: input.cover.date,
            backgroundColor: input.cover.backgroundColor || '#ffffff',
            logoUrl: input.cover.logoUrl,
          }))
        : { title: input.title },
      exportOptions: JSON.parse(JSON.stringify(DEFAULT_EXPORT_OPTIONS)),
    },
    include: {
      photos: {
        include: {
          photo: true,
        },
      },
    },
  });

  return mapPrismaAlbumToAlbum(album);
}

/**
 * Update album
 */
export async function updateAlbum(
  albumId: string,
  input: UpdateAlbumInput
): Promise<Album | null> {
  const existingAlbum = await prisma.album.findUnique({
    where: { id: albumId },
  });

  if (!existingAlbum) {
    return null;
  }

  const existingCover = (existingAlbum.cover as AlbumCover | null) || {};
  const existingExportOptions =
    (existingAlbum.exportOptions as ExportOptions | null) || DEFAULT_EXPORT_OPTIONS;

  const album = await prisma.album.update({
    where: { id: albumId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.name && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.coverPhotoId !== undefined && { coverPhotoId: input.coverPhotoId }),
      ...(input.status && { status: mapToPrismaStatus(input.status) }),
      ...(input.cover && {
        cover: JSON.parse(JSON.stringify({
          ...existingCover,
          ...input.cover,
        })),
      }),
      ...(input.exportOptions && {
        exportOptions: JSON.parse(JSON.stringify({
          ...existingExportOptions,
          ...input.exportOptions,
        })),
      }),
    },
    include: {
      photos: {
        include: {
          photo: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return mapPrismaAlbumToAlbum(album);
}

/**
 * Delete album
 */
export async function deleteAlbum(albumId: string): Promise<boolean> {
  try {
    await prisma.album.delete({
      where: { id: albumId },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Add photos to album
 */
export async function addPhotosToAlbum(
  albumId: string,
  photos: { id: string; title: string; url: string; thumbnailUrl?: string }[]
): Promise<Album | null> {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: {
      photos: {
        orderBy: { sortOrder: 'desc' },
        take: 1,
      },
    },
  });

  if (!album) {
    return null;
  }

  const maxOrder = album.photos[0]?.sortOrder ?? -1;

  // Add new album photos
  await prisma.albumPhoto.createMany({
    data: photos.map((photo, index) => ({
      albumId,
      photoId: photo.id,
      sortOrder: maxOrder + index + 1,
      customTitle: photo.title,
    })),
    skipDuplicates: true,
  });

  return getAlbum(albumId);
}

/**
 * Add photo IDs to album (for photos that already exist in DB)
 */
export async function addPhotoIdsToAlbum(
  albumId: string,
  photoIds: string[]
): Promise<Album | null> {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
    include: {
      photos: {
        orderBy: { sortOrder: 'desc' },
        take: 1,
      },
    },
  });

  if (!album) {
    return null;
  }

  const maxOrder = album.photos[0]?.sortOrder ?? -1;

  // Add new album photos
  await prisma.albumPhoto.createMany({
    data: photoIds.map((photoId, index) => ({
      albumId,
      photoId,
      sortOrder: maxOrder + index + 1,
    })),
    skipDuplicates: true,
  });

  return getAlbum(albumId);
}

/**
 * Remove photos from album
 */
export async function removePhotosFromAlbum(
  albumId: string,
  photoIds: string[]
): Promise<Album | null> {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
  });

  if (!album) {
    return null;
  }

  await prisma.albumPhoto.deleteMany({
    where: {
      albumId,
      photoId: { in: photoIds },
    },
  });

  // Re-order remaining photos
  const remainingPhotos = await prisma.albumPhoto.findMany({
    where: { albumId },
    orderBy: { sortOrder: 'asc' },
  });

  await Promise.all(
    remainingPhotos.map((photo, index) =>
      prisma.albumPhoto.update({
        where: { id: photo.id },
        data: { sortOrder: index },
      })
    )
  );

  return getAlbum(albumId);
}

/**
 * Reorder photos in album
 */
export async function reorderPhotos(
  albumId: string,
  photoOrders: { photoId: string; order: number }[]
): Promise<Album | null> {
  const album = await prisma.album.findUnique({
    where: { id: albumId },
  });

  if (!album) {
    return null;
  }

  await Promise.all(
    photoOrders.map((po) =>
      prisma.albumPhoto.updateMany({
        where: {
          albumId,
          photoId: po.photoId,
        },
        data: {
          sortOrder: po.order,
        },
      })
    )
  );

  return getAlbum(albumId);
}

/**
 * Update album status after export
 */
export async function markAsExported(albumId: string): Promise<Album | null> {
  const album = await prisma.album.update({
    where: { id: albumId },
    data: {
      status: 'PUBLISHED',
      lastExportedAt: new Date(),
    },
    include: {
      photos: {
        include: {
          photo: true,
        },
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  return mapPrismaAlbumToAlbum(album);
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

/**
 * Get photos available for album (from project)
 */
export async function getAvailablePhotos(
  projectId: string,
  albumId: string,
  page = 1,
  pageSize = 50
): Promise<{
  photos: Photo[];
  total: number;
}> {
  // Get photos already in album
  const albumPhotos = await prisma.albumPhoto.findMany({
    where: { albumId },
    select: { photoId: true },
  });
  const albumPhotoIds = new Set(albumPhotos.map((ap) => ap.photoId));

  // Get project photos not in album
  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where: {
        projectId,
        id: { notIn: Array.from(albumPhotoIds) },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.photo.count({
      where: {
        projectId,
        id: { notIn: Array.from(albumPhotoIds) },
      },
    }),
  ]);

  return { photos, total };
}

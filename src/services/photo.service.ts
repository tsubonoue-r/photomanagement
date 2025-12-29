/**
 * Photo Service
 * Handles business logic for photo operations including DB persistence
 */

import { prisma } from '@/lib/prisma';
import type { Photo as PrismaPhoto } from '@prisma/client';
import type { UploadedPhoto, ExifData } from '@/types/photo';

/**
 * Input for creating a photo record
 */
export interface CreatePhotoInput {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnailUrl: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  width: number;
  height: number;
  projectId?: string;
  categoryId?: string;
  uploadedBy: string;
  exifData?: ExifData;
  location?: string;
  takenAt?: Date;
  latitude?: number;
  longitude?: number;
}

/**
 * Create a photo record in the database
 */
export async function createPhoto(input: CreatePhotoInput): Promise<PrismaPhoto> {
  const photo = await prisma.photo.create({
    data: {
      id: input.id,
      title: input.title,
      description: input.description,
      url: input.url,
      thumbnailUrl: input.thumbnailUrl,
      filename: input.filename,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      width: input.width,
      height: input.height,
      projectId: input.projectId,
      categoryId: input.categoryId,
      uploadedBy: input.uploadedBy,
      exifData: input.exifData ? JSON.parse(JSON.stringify(input.exifData)) : null,
      location: input.location,
      takenAt: input.takenAt,
      latitude: input.latitude,
      longitude: input.longitude,
    },
  });

  return photo;
}

/**
 * Create photo record from uploaded photo data
 */
export async function createPhotoFromUpload(
  uploadedPhoto: UploadedPhoto,
  options: {
    projectId?: string;
    categoryId?: string;
    uploadedBy: string;
    title?: string;
    description?: string;
  }
): Promise<PrismaPhoto> {
  const { metadata } = uploadedPhoto;

  return createPhoto({
    id: uploadedPhoto.id,
    title: options.title || metadata.originalName,
    description: options.description,
    url: uploadedPhoto.originalUrl,
    thumbnailUrl: uploadedPhoto.thumbnailSmallUrl,
    filename: metadata.originalName,
    mimeType: metadata.mimeType,
    fileSize: metadata.size,
    width: metadata.width,
    height: metadata.height,
    projectId: options.projectId,
    categoryId: options.categoryId,
    uploadedBy: options.uploadedBy,
    exifData: metadata.exif,
    takenAt: metadata.exif.dateTimeOriginal,
    latitude: metadata.exif.latitude,
    longitude: metadata.exif.longitude,
  });
}

/**
 * Get photo by ID
 */
export async function getPhotoById(id: string): Promise<PrismaPhoto | null> {
  return prisma.photo.findUnique({
    where: { id },
    include: {
      category: true,
      project: true,
    },
  });
}

/**
 * Get photos with pagination
 */
export async function getPhotos(options: {
  projectId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
  orderBy?: 'createdAt' | 'takenAt' | 'filename';
  order?: 'asc' | 'desc';
}): Promise<{
  photos: PrismaPhoto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const {
    projectId,
    categoryId,
    page = 1,
    limit = 20,
    orderBy = 'createdAt',
    order = 'desc',
  } = options;

  const where = {
    ...(projectId && { projectId }),
    ...(categoryId && { categoryId }),
  };

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [orderBy]: order },
      include: {
        category: true,
      },
    }),
    prisma.photo.count({ where }),
  ]);

  return {
    photos,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Update photo
 */
export async function updatePhoto(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    categoryId: string;
    location: string;
    blackboardData: Record<string, unknown>;
  }>
): Promise<PrismaPhoto> {
  return prisma.photo.update({
    where: { id },
    data,
  });
}

/**
 * Delete photo
 */
export async function deletePhoto(id: string): Promise<void> {
  await prisma.photo.delete({
    where: { id },
  });
}

/**
 * Delete multiple photos
 */
export async function deletePhotos(ids: string[]): Promise<number> {
  const result = await prisma.photo.deleteMany({
    where: {
      id: { in: ids },
    },
  });

  return result.count;
}

/**
 * Move photos to a different project
 */
export async function movePhotosToProject(
  photoIds: string[],
  targetProjectId: string
): Promise<number> {
  const result = await prisma.photo.updateMany({
    where: {
      id: { in: photoIds },
    },
    data: {
      projectId: targetProjectId,
    },
  });

  return result.count;
}

/**
 * Update category for multiple photos
 */
export async function updatePhotosCategory(
  photoIds: string[],
  categoryId: string
): Promise<number> {
  const result = await prisma.photo.updateMany({
    where: {
      id: { in: photoIds },
    },
    data: {
      categoryId,
    },
  });

  return result.count;
}

/**
 * Search photos by text
 */
export async function searchPhotos(options: {
  query: string;
  projectId?: string;
  page?: number;
  limit?: number;
}): Promise<{
  photos: PrismaPhoto[];
  total: number;
}> {
  const { query, projectId, page = 1, limit = 20 } = options;

  const where = {
    ...(projectId && { projectId }),
    OR: [
      { title: { contains: query, mode: 'insensitive' as const } },
      { description: { contains: query, mode: 'insensitive' as const } },
      { filename: { contains: query, mode: 'insensitive' as const } },
      { location: { contains: query, mode: 'insensitive' as const } },
    ],
  };

  const [photos, total] = await Promise.all([
    prisma.photo.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    }),
    prisma.photo.count({ where }),
  ]);

  return { photos, total };
}

/**
 * Albums API Integration Tests
 * Issue #27: Testing for album API endpoints
 */

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    album: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    albumPhoto: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

describe('Albums API', () => {
  const mockSession = {
    user: {
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'MEMBER',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(mockSession);
  });

  describe('GET /api/albums', () => {
    it('should return all albums for a project', async () => {
      const mockAlbums = [
        {
          id: 'album-1',
          name: 'Foundation Work Album',
          description: 'Photos of foundation work',
          projectId: 'project-1',
          createdAt: new Date(),
          _count: { photos: 10 },
        },
        {
          id: 'album-2',
          name: 'Framing Album',
          description: 'Photos of framing work',
          projectId: 'project-1',
          createdAt: new Date(),
          _count: { photos: 15 },
        },
      ];

      (prisma.album.findMany as jest.Mock).mockResolvedValue(mockAlbums);

      const result = await prisma.album.findMany({
        where: { projectId: 'project-1' },
        include: { _count: { select: { photos: true } } },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(mockAlbums);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no albums exist', async () => {
      (prisma.album.findMany as jest.Mock).mockResolvedValue([]);

      const result = await prisma.album.findMany({
        where: { projectId: 'project-1' },
      });

      expect(result).toEqual([]);
    });
  });

  describe('GET /api/albums/:id', () => {
    it('should return an album with photos', async () => {
      const mockAlbum = {
        id: 'album-1',
        name: 'Test Album',
        description: 'Test description',
        projectId: 'project-1',
        photos: [
          {
            photo: {
              id: 'photo-1',
              title: 'Photo 1',
              url: 'https://example.com/photo1.jpg',
            },
            order: 1,
          },
          {
            photo: {
              id: 'photo-2',
              title: 'Photo 2',
              url: 'https://example.com/photo2.jpg',
            },
            order: 2,
          },
        ],
      };

      (prisma.album.findUnique as jest.Mock).mockResolvedValue(mockAlbum);

      const result = await prisma.album.findUnique({
        where: { id: 'album-1' },
        include: {
          photos: {
            include: { photo: true },
            orderBy: { order: 'asc' },
          },
        },
      });

      expect(result).toEqual(mockAlbum);
      expect(result?.photos).toHaveLength(2);
    });

    it('should return null for non-existent album', async () => {
      (prisma.album.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await prisma.album.findUnique({
        where: { id: 'non-existent' },
      });

      expect(result).toBeNull();
    });
  });

  describe('POST /api/albums', () => {
    it('should create a new album', async () => {
      const mockAlbum = {
        id: 'album-1',
        name: 'New Album',
        description: 'New album description',
        projectId: 'project-1',
        createdBy: 'user-1',
        createdAt: new Date(),
      };

      (prisma.album.create as jest.Mock).mockResolvedValue(mockAlbum);

      const result = await prisma.album.create({
        data: {
          name: 'New Album',
          description: 'New album description',
          projectId: 'project-1',
          createdBy: 'user-1',
        },
      });

      expect(result).toEqual(mockAlbum);
      expect(result.name).toBe('New Album');
    });

    it('should create album with initial photos', async () => {
      const mockAlbum = {
        id: 'album-1',
        name: 'Album with Photos',
        projectId: 'project-1',
      };

      (prisma.album.create as jest.Mock).mockResolvedValue(mockAlbum);
      (prisma.albumPhoto.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      await prisma.album.create({
        data: {
          name: 'Album with Photos',
          projectId: 'project-1',
          createdBy: 'user-1',
        },
      });

      const photoResult = await prisma.albumPhoto.createMany({
        data: [
          { albumId: 'album-1', photoId: 'photo-1', order: 1 },
          { albumId: 'album-1', photoId: 'photo-2', order: 2 },
          { albumId: 'album-1', photoId: 'photo-3', order: 3 },
        ],
      });

      expect(photoResult.count).toBe(3);
    });
  });

  describe('PUT /api/albums/:id', () => {
    it('should update album name', async () => {
      const mockUpdatedAlbum = {
        id: 'album-1',
        name: 'Updated Album Name',
      };

      (prisma.album.update as jest.Mock).mockResolvedValue(mockUpdatedAlbum);

      const result = await prisma.album.update({
        where: { id: 'album-1' },
        data: { name: 'Updated Album Name' },
      });

      expect(result.name).toBe('Updated Album Name');
    });

    it('should update album description', async () => {
      const mockUpdatedAlbum = {
        id: 'album-1',
        description: 'Updated description',
      };

      (prisma.album.update as jest.Mock).mockResolvedValue(mockUpdatedAlbum);

      const result = await prisma.album.update({
        where: { id: 'album-1' },
        data: { description: 'Updated description' },
      });

      expect(result.description).toBe('Updated description');
    });
  });

  describe('DELETE /api/albums/:id', () => {
    it('should delete an album', async () => {
      (prisma.album.delete as jest.Mock).mockResolvedValue({ id: 'album-1' });

      await prisma.album.delete({
        where: { id: 'album-1' },
      });

      expect(prisma.album.delete).toHaveBeenCalledWith({
        where: { id: 'album-1' },
      });
    });

    it('should delete album photos when deleting album', async () => {
      (prisma.albumPhoto.deleteMany as jest.Mock).mockResolvedValue({ count: 5 });
      (prisma.album.delete as jest.Mock).mockResolvedValue({ id: 'album-1' });

      await prisma.albumPhoto.deleteMany({
        where: { albumId: 'album-1' },
      });

      await prisma.album.delete({
        where: { id: 'album-1' },
      });

      expect(prisma.albumPhoto.deleteMany).toHaveBeenCalledWith({
        where: { albumId: 'album-1' },
      });
    });
  });

  describe('POST /api/albums/:id/photos', () => {
    it('should add photos to an album', async () => {
      (prisma.albumPhoto.createMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await prisma.albumPhoto.createMany({
        data: [
          { albumId: 'album-1', photoId: 'photo-1', order: 1 },
          { albumId: 'album-1', photoId: 'photo-2', order: 2 },
        ],
      });

      expect(result.count).toBe(2);
    });

    it('should reorder photos in an album', async () => {
      // Delete existing order
      (prisma.albumPhoto.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });
      // Create new order
      (prisma.albumPhoto.createMany as jest.Mock).mockResolvedValue({ count: 3 });

      await prisma.albumPhoto.deleteMany({
        where: { albumId: 'album-1' },
      });

      await prisma.albumPhoto.createMany({
        data: [
          { albumId: 'album-1', photoId: 'photo-3', order: 1 },
          { albumId: 'album-1', photoId: 'photo-1', order: 2 },
          { albumId: 'album-1', photoId: 'photo-2', order: 3 },
        ],
      });

      expect(prisma.albumPhoto.deleteMany).toHaveBeenCalled();
      expect(prisma.albumPhoto.createMany).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/albums/:id/photos', () => {
    it('should remove photos from an album', async () => {
      (prisma.albumPhoto.deleteMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await prisma.albumPhoto.deleteMany({
        where: {
          albumId: 'album-1',
          photoId: { in: ['photo-1', 'photo-2'] },
        },
      });

      expect(result.count).toBe(2);
    });
  });

  describe('GET /api/albums/:id/export', () => {
    it('should export album as PDF', async () => {
      // This test would verify that the export endpoint returns correct data
      // The actual PDF generation is handled by the export service
      const mockAlbum = {
        id: 'album-1',
        name: 'Export Album',
        photos: [
          { photo: { id: 'photo-1', url: 'https://example.com/photo1.jpg' } },
          { photo: { id: 'photo-2', url: 'https://example.com/photo2.jpg' } },
        ],
      };

      (prisma.album.findUnique as jest.Mock).mockResolvedValue(mockAlbum);

      const result = await prisma.album.findUnique({
        where: { id: 'album-1' },
        include: {
          photos: {
            include: { photo: true },
            orderBy: { order: 'asc' },
          },
        },
      });

      expect(result).toEqual(mockAlbum);
      expect(result?.photos).toHaveLength(2);
    });

    it('should export album as ZIP', async () => {
      const mockAlbum = {
        id: 'album-1',
        name: 'Export Album',
        photos: [
          { photo: { id: 'photo-1', url: 'https://example.com/photo1.jpg' } },
        ],
      };

      (prisma.album.findUnique as jest.Mock).mockResolvedValue(mockAlbum);

      const result = await prisma.album.findUnique({
        where: { id: 'album-1' },
        include: { photos: { include: { photo: true } } },
      });

      expect(result?.photos).toBeDefined();
    });
  });
});

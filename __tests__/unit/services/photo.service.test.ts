/**
 * Photo Service Unit Tests
 * Issue #27: Testing for photo service
 */

import { mockPrisma, resetPrismaMocks } from '../../mocks/prisma';

// Mock the module before importing
jest.mock('@/lib/prisma', () => ({
  prisma: {
    photo: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

import {
  createPhoto,
  getPhotoById,
  getPhotos,
  updatePhoto,
  deletePhoto,
  deletePhotos,
  movePhotosToProject,
  updatePhotosCategory,
  searchPhotos,
} from '@/services/photo.service';
import { prisma } from '@/lib/prisma';

describe('Photo Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPhoto', () => {
    it('should create a photo record', async () => {
      const mockPhoto = {
        id: 'photo-1',
        title: 'Test Photo',
        url: 'https://example.com/photo.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        projectId: 'project-1',
        categoryId: null,
        uploadedBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.photo.create as jest.Mock).mockResolvedValue(mockPhoto);

      const input = {
        id: 'photo-1',
        title: 'Test Photo',
        url: 'https://example.com/photo.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        projectId: 'project-1',
        uploadedBy: 'user-1',
      };

      const result = await createPhoto(input);

      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'photo-1',
          title: 'Test Photo',
          uploadedBy: 'user-1',
        }),
      });
      expect(result).toEqual(mockPhoto);
    });

    it('should handle EXIF data', async () => {
      const mockPhoto = {
        id: 'photo-1',
        title: 'Test Photo',
        exifData: { make: 'Canon', model: 'EOS R5' },
      };

      (prisma.photo.create as jest.Mock).mockResolvedValue(mockPhoto);

      const input = {
        id: 'photo-1',
        title: 'Test Photo',
        url: 'https://example.com/photo.jpg',
        thumbnailUrl: 'https://example.com/thumb.jpg',
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1024000,
        width: 1920,
        height: 1080,
        uploadedBy: 'user-1',
        exifData: { make: 'Canon', model: 'EOS R5' },
      };

      await createPhoto(input);

      expect(prisma.photo.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          exifData: expect.any(Object),
        }),
      });
    });
  });

  describe('getPhotoById', () => {
    it('should return photo by ID', async () => {
      const mockPhoto = {
        id: 'photo-1',
        title: 'Test Photo',
        category: { id: 'cat-1', name: 'Category 1' },
        project: { id: 'proj-1', name: 'Project 1' },
      };

      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(mockPhoto);

      const result = await getPhotoById('photo-1');

      expect(prisma.photo.findUnique).toHaveBeenCalledWith({
        where: { id: 'photo-1' },
        include: {
          category: true,
          project: true,
        },
      });
      expect(result).toEqual(mockPhoto);
    });

    it('should return null for non-existent photo', async () => {
      (prisma.photo.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getPhotoById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getPhotos', () => {
    it('should return paginated photos', async () => {
      const mockPhotos = [
        { id: 'photo-1', title: 'Photo 1' },
        { id: 'photo-2', title: 'Photo 2' },
      ];

      (prisma.photo.findMany as jest.Mock).mockResolvedValue(mockPhotos);
      (prisma.photo.count as jest.Mock).mockResolvedValue(50);

      const result = await getPhotos({
        projectId: 'project-1',
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        photos: mockPhotos,
        total: 50,
        page: 1,
        limit: 20,
        totalPages: 3,
      });
    });

    it('should apply filters correctly', async () => {
      (prisma.photo.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.photo.count as jest.Mock).mockResolvedValue(0);

      await getPhotos({
        projectId: 'project-1',
        categoryId: 'cat-1',
      });

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            projectId: 'project-1',
            categoryId: 'cat-1',
          },
        })
      );
    });

    it('should use default pagination values', async () => {
      (prisma.photo.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.photo.count as jest.Mock).mockResolvedValue(0);

      const result = await getPhotos({});

      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('should apply sorting correctly', async () => {
      (prisma.photo.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.photo.count as jest.Mock).mockResolvedValue(0);

      await getPhotos({
        orderBy: 'takenAt',
        order: 'asc',
      });

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { takenAt: 'asc' },
        })
      );
    });
  });

  describe('updatePhoto', () => {
    it('should update photo fields', async () => {
      const mockUpdatedPhoto = {
        id: 'photo-1',
        title: 'Updated Title',
        description: 'New description',
      };

      (prisma.photo.update as jest.Mock).mockResolvedValue(mockUpdatedPhoto);

      const result = await updatePhoto('photo-1', {
        title: 'Updated Title',
        description: 'New description',
      });

      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { id: 'photo-1' },
        data: {
          title: 'Updated Title',
          description: 'New description',
        },
      });
      expect(result).toEqual(mockUpdatedPhoto);
    });

    it('should update category', async () => {
      (prisma.photo.update as jest.Mock).mockResolvedValue({});

      await updatePhoto('photo-1', {
        categoryId: 'new-cat-id',
      });

      expect(prisma.photo.update).toHaveBeenCalledWith({
        where: { id: 'photo-1' },
        data: { categoryId: 'new-cat-id' },
      });
    });
  });

  describe('deletePhoto', () => {
    it('should delete a photo', async () => {
      (prisma.photo.delete as jest.Mock).mockResolvedValue({});

      await deletePhoto('photo-1');

      expect(prisma.photo.delete).toHaveBeenCalledWith({
        where: { id: 'photo-1' },
      });
    });
  });

  describe('deletePhotos', () => {
    it('should delete multiple photos', async () => {
      (prisma.photo.deleteMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await deletePhotos(['photo-1', 'photo-2', 'photo-3']);

      expect(prisma.photo.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['photo-1', 'photo-2', 'photo-3'] },
        },
      });
      expect(result).toBe(3);
    });

    it('should return 0 for empty array', async () => {
      (prisma.photo.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      const result = await deletePhotos([]);

      expect(result).toBe(0);
    });
  });

  describe('movePhotosToProject', () => {
    it('should move photos to a different project', async () => {
      (prisma.photo.updateMany as jest.Mock).mockResolvedValue({ count: 2 });

      const result = await movePhotosToProject(
        ['photo-1', 'photo-2'],
        'new-project-id'
      );

      expect(prisma.photo.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['photo-1', 'photo-2'] },
        },
        data: {
          projectId: 'new-project-id',
        },
      });
      expect(result).toBe(2);
    });
  });

  describe('updatePhotosCategory', () => {
    it('should update category for multiple photos', async () => {
      (prisma.photo.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      const result = await updatePhotosCategory(
        ['photo-1', 'photo-2', 'photo-3'],
        'new-category-id'
      );

      expect(prisma.photo.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['photo-1', 'photo-2', 'photo-3'] },
        },
        data: {
          categoryId: 'new-category-id',
        },
      });
      expect(result).toBe(3);
    });
  });

  describe('searchPhotos', () => {
    it('should search photos by query', async () => {
      const mockPhotos = [
        { id: 'photo-1', title: 'Foundation Work' },
        { id: 'photo-2', title: 'Foundation Complete' },
      ];

      (prisma.photo.findMany as jest.Mock).mockResolvedValue(mockPhotos);
      (prisma.photo.count as jest.Mock).mockResolvedValue(2);

      const result = await searchPhotos({
        query: 'foundation',
        projectId: 'project-1',
      });

      expect(result.photos).toEqual(mockPhotos);
      expect(result.total).toBe(2);
    });

    it('should search across multiple fields', async () => {
      (prisma.photo.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.photo.count as jest.Mock).mockResolvedValue(0);

      await searchPhotos({ query: 'test' });

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: expect.any(Object) },
              { description: expect.any(Object) },
              { filename: expect.any(Object) },
              { location: expect.any(Object) },
            ]),
          }),
        })
      );
    });

    it('should apply pagination to search results', async () => {
      (prisma.photo.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.photo.count as jest.Mock).mockResolvedValue(0);

      await searchPhotos({
        query: 'test',
        page: 2,
        limit: 10,
      });

      expect(prisma.photo.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });
});

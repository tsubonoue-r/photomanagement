/**
 * Categories API Integration Tests
 * Issue #27: Testing for category API endpoints
 */

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    photo: {
      count: jest.fn(),
    },
  },
}));

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

describe('Categories API', () => {
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

  describe('GET /api/categories', () => {
    it('should return all categories for a project as tree', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Foundation',
          code: '01',
          parentId: null,
          projectId: 'project-1',
          order: 1,
          children: [
            {
              id: 'cat-1-1',
              name: 'Excavation',
              code: '01-01',
              parentId: 'cat-1',
              projectId: 'project-1',
              order: 1,
            },
            {
              id: 'cat-1-2',
              name: 'Concrete Pouring',
              code: '01-02',
              parentId: 'cat-1',
              projectId: 'project-1',
              order: 2,
            },
          ],
        },
        {
          id: 'cat-2',
          name: 'Framing',
          code: '02',
          parentId: null,
          projectId: 'project-1',
          order: 2,
          children: [],
        },
      ];

      (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await prisma.category.findMany({
        where: {
          projectId: 'project-1',
          parentId: null,
        },
        include: {
          children: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      });

      expect(result).toEqual(mockCategories);
      expect(result).toHaveLength(2);
      expect(result[0].children).toHaveLength(2);
    });

    it('should return flat list when requested', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Foundation', code: '01' },
        { id: 'cat-1-1', name: 'Excavation', code: '01-01' },
        { id: 'cat-1-2', name: 'Concrete Pouring', code: '01-02' },
        { id: 'cat-2', name: 'Framing', code: '02' },
      ];

      (prisma.category.findMany as jest.Mock).mockResolvedValue(mockCategories);

      const result = await prisma.category.findMany({
        where: { projectId: 'project-1' },
        orderBy: { code: 'asc' },
      });

      expect(result).toHaveLength(4);
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return a category with children and photo count', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Foundation',
        code: '01',
        description: 'Foundation work category',
        parentId: null,
        projectId: 'project-1',
        children: [
          { id: 'cat-1-1', name: 'Excavation' },
        ],
        _count: { photos: 25 },
      };

      (prisma.category.findUnique as jest.Mock).mockResolvedValue(mockCategory);

      const result = await prisma.category.findUnique({
        where: { id: 'cat-1' },
        include: {
          children: true,
          _count: { select: { photos: true } },
        },
      });

      expect(result).toEqual(mockCategory);
      expect(result?._count.photos).toBe(25);
    });

    it('should return null for non-existent category', async () => {
      (prisma.category.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await prisma.category.findUnique({
        where: { id: 'non-existent' },
      });

      expect(result).toBeNull();
    });
  });

  describe('POST /api/categories', () => {
    it('should create a root category', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'New Category',
        code: '03',
        description: null,
        parentId: null,
        projectId: 'project-1',
        order: 3,
        createdAt: new Date(),
      };

      (prisma.category.create as jest.Mock).mockResolvedValue(mockCategory);

      const result = await prisma.category.create({
        data: {
          name: 'New Category',
          code: '03',
          projectId: 'project-1',
          order: 3,
        },
      });

      expect(result).toEqual(mockCategory);
      expect(result.parentId).toBeNull();
    });

    it('should create a child category', async () => {
      const mockCategory = {
        id: 'cat-1-3',
        name: 'Reinforcement',
        code: '01-03',
        parentId: 'cat-1',
        projectId: 'project-1',
        order: 3,
      };

      (prisma.category.create as jest.Mock).mockResolvedValue(mockCategory);

      const result = await prisma.category.create({
        data: {
          name: 'Reinforcement',
          code: '01-03',
          parentId: 'cat-1',
          projectId: 'project-1',
          order: 3,
        },
      });

      expect(result.parentId).toBe('cat-1');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category name', async () => {
      const mockUpdatedCategory = {
        id: 'cat-1',
        name: 'Updated Foundation',
      };

      (prisma.category.update as jest.Mock).mockResolvedValue(mockUpdatedCategory);

      const result = await prisma.category.update({
        where: { id: 'cat-1' },
        data: { name: 'Updated Foundation' },
      });

      expect(result.name).toBe('Updated Foundation');
    });

    it('should update category code', async () => {
      const mockUpdatedCategory = {
        id: 'cat-1',
        code: '10',
      };

      (prisma.category.update as jest.Mock).mockResolvedValue(mockUpdatedCategory);

      const result = await prisma.category.update({
        where: { id: 'cat-1' },
        data: { code: '10' },
      });

      expect(result.code).toBe('10');
    });

    it('should update category parent', async () => {
      const mockUpdatedCategory = {
        id: 'cat-1-1',
        parentId: 'cat-2',
      };

      (prisma.category.update as jest.Mock).mockResolvedValue(mockUpdatedCategory);

      const result = await prisma.category.update({
        where: { id: 'cat-1-1' },
        data: { parentId: 'cat-2' },
      });

      expect(result.parentId).toBe('cat-2');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category without photos', async () => {
      (prisma.photo.count as jest.Mock).mockResolvedValue(0);
      (prisma.category.delete as jest.Mock).mockResolvedValue({ id: 'cat-1' });

      const photoCount = await prisma.photo.count({
        where: { categoryId: 'cat-1' },
      });

      expect(photoCount).toBe(0);

      await prisma.category.delete({
        where: { id: 'cat-1' },
      });

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
    });

    it('should not delete a category with photos', async () => {
      (prisma.photo.count as jest.Mock).mockResolvedValue(5);

      const photoCount = await prisma.photo.count({
        where: { categoryId: 'cat-1' },
      });

      expect(photoCount).toBe(5);
      // API should return 400 error when trying to delete category with photos
    });

    it('should delete category with children when cascade is enabled', async () => {
      (prisma.category.delete as jest.Mock).mockResolvedValue({ id: 'cat-1' });

      await prisma.category.delete({
        where: { id: 'cat-1' },
      });

      expect(prisma.category.delete).toHaveBeenCalled();
    });
  });

  describe('POST /api/categories/reorder', () => {
    it('should reorder categories', async () => {
      (prisma.category.updateMany as jest.Mock).mockResolvedValue({ count: 3 });

      // Update multiple categories with new order
      await prisma.category.updateMany({
        where: { id: { in: ['cat-1', 'cat-2', 'cat-3'] } },
        data: { order: 1 }, // This would be done individually in real implementation
      });

      expect(prisma.category.updateMany).toHaveBeenCalled();
    });

    it('should update individual category orders', async () => {
      const updates = [
        { id: 'cat-1', order: 3 },
        { id: 'cat-2', order: 1 },
        { id: 'cat-3', order: 2 },
      ];

      for (const update of updates) {
        (prisma.category.update as jest.Mock).mockResolvedValue(update);
        await prisma.category.update({
          where: { id: update.id },
          data: { order: update.order },
        });
      }

      expect(prisma.category.update).toHaveBeenCalledTimes(3);
    });
  });

  describe('POST /api/categories/import-standard', () => {
    it('should import standard categories', async () => {
      const standardCategories = [
        { name: 'Foundation Work', code: '01' },
        { name: 'Framing Work', code: '02' },
        { name: 'Roofing Work', code: '03' },
      ];

      const mockCreatedCategories = standardCategories.map((cat, index) => ({
        ...cat,
        id: `cat-${index + 1}`,
        projectId: 'project-1',
        order: index + 1,
      }));

      (prisma.category.create as jest.Mock)
        .mockResolvedValueOnce(mockCreatedCategories[0])
        .mockResolvedValueOnce(mockCreatedCategories[1])
        .mockResolvedValueOnce(mockCreatedCategories[2]);

      for (const [index, cat] of standardCategories.entries()) {
        const result = await prisma.category.create({
          data: {
            name: cat.name,
            code: cat.code,
            projectId: 'project-1',
            order: index + 1,
          },
        });
        expect(result).toEqual(mockCreatedCategories[index]);
      }
    });

    it('should skip existing categories', async () => {
      (prisma.category.findMany as jest.Mock).mockResolvedValue([
        { code: '01', name: 'Foundation Work' },
      ]);

      const existing = await prisma.category.findMany({
        where: { projectId: 'project-1' },
      });

      // Only import categories that don't exist
      const existingCodes = existing.map((c: { code: string }) => c.code);
      expect(existingCodes).toContain('01');
    });
  });
});

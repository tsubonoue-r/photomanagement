/**
 * Project Service
 * Business logic for project management with Prisma
 * Issue #30: Project Management Screen Implementation
 */

import { prisma } from '@/lib/prisma';
import type { ProjectStatus } from '@prisma/client';
import type {
  Project,
  ProjectWithCounts,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectListResponse,
  ProjectFilterOptions,
} from '@/types/project';

/**
 * Get all projects with optional filtering
 */
export async function getProjects(
  organizationId: string,
  options: ProjectFilterOptions = {}
): Promise<ProjectListResponse> {
  const { status, search, page = 1, pageSize = 20 } = options;

  const where: {
    organizationId: string;
    status?: ProjectStatus;
    OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
  } = {
    organizationId,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            photos: true,
            albums: true,
            members: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects: projects as ProjectWithCounts[],
    total,
    page,
    pageSize,
  };
}

/**
 * Get all projects without organization filter (for dashboard)
 */
export async function getAllProjects(
  options: Omit<ProjectFilterOptions, 'organizationId'> = {}
): Promise<ProjectListResponse> {
  const { status, search, page = 1, pageSize = 20 } = options;

  const where: {
    status?: ProjectStatus;
    OR?: Array<{ name?: { contains: string; mode: 'insensitive' }; description?: { contains: string; mode: 'insensitive' } }>;
  } = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: {
            photos: true,
            albums: true,
            members: true,
          },
        },
      },
    }),
    prisma.project.count({ where }),
  ]);

  return {
    projects: projects as ProjectWithCounts[],
    total,
    page,
    pageSize,
  };
}

/**
 * Get single project by ID
 */
export async function getProject(projectId: string): Promise<ProjectWithCounts | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: {
        select: {
          photos: true,
          albums: true,
          members: true,
        },
      },
    },
  });

  return project as ProjectWithCounts | null;
}

/**
 * Create new project
 */
export async function createProject(
  organizationId: string,
  input: CreateProjectInput
): Promise<Project> {
  const project = await prisma.project.create({
    data: {
      organizationId,
      name: input.name,
      code: input.code || null,
      description: input.description || null,
      clientName: input.clientName || null,
      contractorName: input.contractorName || null,
      location: input.location || null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      status: input.status || 'ACTIVE',
      // 新フィールド
      salesPerson: input.salesPerson || null,
      constructionName: input.constructionName || null,
      steelFabricationCategory: input.steelFabricationCategory || null,
      membraneFabricationCategory: input.membraneFabricationCategory || null,
      constructionPhoto: input.constructionPhoto || null,
    },
    include: {
      _count: {
        select: {
          photos: true,
          albums: true,
          members: true,
        },
      },
    },
  });

  return project as Project;
}

/**
 * Update project
 */
export async function updateProject(
  projectId: string,
  input: UpdateProjectInput
): Promise<Project | null> {
  const existingProject = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!existingProject) {
    return null;
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.code !== undefined && { code: input.code || null }),
      ...(input.description !== undefined && { description: input.description || null }),
      ...(input.clientName !== undefined && { clientName: input.clientName || null }),
      ...(input.contractorName !== undefined && { contractorName: input.contractorName || null }),
      ...(input.location !== undefined && { location: input.location || null }),
      ...(input.startDate !== undefined && {
        startDate: input.startDate ? new Date(input.startDate) : null,
      }),
      ...(input.endDate !== undefined && {
        endDate: input.endDate ? new Date(input.endDate) : null,
      }),
      ...(input.status !== undefined && { status: input.status }),
      // 新フィールド
      ...(input.salesPerson !== undefined && { salesPerson: input.salesPerson || null }),
      ...(input.constructionName !== undefined && { constructionName: input.constructionName || null }),
      ...(input.steelFabricationCategory !== undefined && { steelFabricationCategory: input.steelFabricationCategory || null }),
      ...(input.membraneFabricationCategory !== undefined && { membraneFabricationCategory: input.membraneFabricationCategory || null }),
      ...(input.constructionPhoto !== undefined && { constructionPhoto: input.constructionPhoto || null }),
    },
    include: {
      _count: {
        select: {
          photos: true,
          albums: true,
          members: true,
        },
      },
    },
  });

  return project as Project;
}

/**
 * Delete project
 */
export async function deleteProject(projectId: string): Promise<boolean> {
  try {
    await prisma.project.delete({
      where: { id: projectId },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if project code is unique
 */
export async function isProjectCodeUnique(
  code: string,
  excludeProjectId?: string
): Promise<boolean> {
  const existing = await prisma.project.findFirst({
    where: {
      code,
      ...(excludeProjectId && { id: { not: excludeProjectId } }),
    },
  });

  return !existing;
}

/**
 * Get project statistics
 */
export async function getProjectStats(projectId: string): Promise<{
  photoCount: number;
  albumCount: number;
  memberCount: number;
  categoryCount: number;
} | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      _count: {
        select: {
          photos: true,
          albums: true,
          members: true,
          categories: true,
        },
      },
    },
  });

  if (!project) {
    return null;
  }

  return {
    photoCount: project._count.photos,
    albumCount: project._count.albums,
    memberCount: project._count.members,
    categoryCount: project._count.categories,
  };
}

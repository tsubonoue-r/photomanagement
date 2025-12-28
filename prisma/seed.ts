import { PrismaClient, PlanType, OrganizationRole, ProjectStatus, ProjectRole, CategoryType, BlackboardPosition } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // ==========================================================================
  // Clean up existing data
  // ==========================================================================
  await prisma.albumPhoto.deleteMany();
  await prisma.album.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.blackboard.deleteMany();
  await prisma.blackboardTemplate.deleteMany();
  await prisma.category.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // ==========================================================================
  // Create Organizations
  // ==========================================================================
  const sampleOrg = await prisma.organization.create({
    data: {
      name: 'Sample Construction Co.',
      slug: 'sample-construction',
      plan: PlanType.PROFESSIONAL,
    },
  });

  const demoOrg = await prisma.organization.create({
    data: {
      name: 'Demo Organization',
      slug: 'demo-org',
      plan: PlanType.FREE,
    },
  });

  console.log('Created organizations:', { sampleOrg, demoOrg });

  // ==========================================================================
  // Create Users
  // ==========================================================================
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      avatarUrl: null,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: 'Project Manager',
      avatarUrl: null,
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: 'member@example.com',
      name: 'Team Member',
      avatarUrl: null,
    },
  });

  const viewerUser = await prisma.user.create({
    data: {
      email: 'viewer@example.com',
      name: 'Viewer User',
      avatarUrl: null,
    },
  });

  console.log('Created users:', { adminUser, managerUser, memberUser, viewerUser });

  // ==========================================================================
  // Create Organization Members
  // ==========================================================================
  await prisma.organizationMember.createMany({
    data: [
      {
        organizationId: sampleOrg.id,
        userId: adminUser.id,
        role: OrganizationRole.OWNER,
      },
      {
        organizationId: sampleOrg.id,
        userId: managerUser.id,
        role: OrganizationRole.ADMIN,
      },
      {
        organizationId: sampleOrg.id,
        userId: memberUser.id,
        role: OrganizationRole.MEMBER,
      },
      {
        organizationId: sampleOrg.id,
        userId: viewerUser.id,
        role: OrganizationRole.VIEWER,
      },
      {
        organizationId: demoOrg.id,
        userId: adminUser.id,
        role: OrganizationRole.OWNER,
      },
    ],
  });

  console.log('Created organization members');

  // ==========================================================================
  // Create Projects
  // ==========================================================================
  const bridgeProject = await prisma.project.create({
    data: {
      organizationId: sampleOrg.id,
      name: 'Bridge Construction Project',
      code: 'BCP-2025-001',
      description: 'New bridge construction over the river',
      clientName: 'City Public Works Department',
      contractorName: 'Sample Construction Co.',
      location: 'Tokyo, Japan',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-12-31'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const roadProject = await prisma.project.create({
    data: {
      organizationId: sampleOrg.id,
      name: 'Highway Extension Project',
      code: 'HEP-2025-002',
      description: 'Highway extension and maintenance work',
      clientName: 'National Road Authority',
      contractorName: 'Sample Construction Co.',
      location: 'Osaka, Japan',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-09-30'),
      status: ProjectStatus.ACTIVE,
    },
  });

  const buildingProject = await prisma.project.create({
    data: {
      organizationId: sampleOrg.id,
      name: 'Office Building Renovation',
      code: 'OBR-2024-010',
      description: 'Renovation of commercial office building',
      clientName: 'Commercial Properties Inc.',
      contractorName: 'Sample Construction Co.',
      location: 'Nagoya, Japan',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-12-15'),
      status: ProjectStatus.COMPLETED,
    },
  });

  console.log('Created projects:', { bridgeProject, roadProject, buildingProject });

  // ==========================================================================
  // Create Project Members
  // ==========================================================================
  await prisma.projectMember.createMany({
    data: [
      // Bridge Project
      {
        projectId: bridgeProject.id,
        userId: managerUser.id,
        role: ProjectRole.MANAGER,
      },
      {
        projectId: bridgeProject.id,
        userId: memberUser.id,
        role: ProjectRole.MEMBER,
      },
      {
        projectId: bridgeProject.id,
        userId: viewerUser.id,
        role: ProjectRole.VIEWER,
      },
      // Road Project
      {
        projectId: roadProject.id,
        userId: managerUser.id,
        role: ProjectRole.MANAGER,
      },
      {
        projectId: roadProject.id,
        userId: memberUser.id,
        role: ProjectRole.MEMBER,
      },
      // Building Project
      {
        projectId: buildingProject.id,
        userId: managerUser.id,
        role: ProjectRole.MANAGER,
      },
    ],
  });

  console.log('Created project members');

  // ==========================================================================
  // Create Categories (Construction Types Hierarchy)
  // ==========================================================================
  // Bridge Project Categories
  const bridgeFoundation = await prisma.category.create({
    data: {
      projectId: bridgeProject.id,
      name: 'Foundation Work',
      type: CategoryType.CONSTRUCTION_TYPE,
      code: '01',
      sortOrder: 1,
    },
  });

  const bridgePier = await prisma.category.create({
    data: {
      projectId: bridgeProject.id,
      name: 'Pier Construction',
      type: CategoryType.CONSTRUCTION_TYPE,
      code: '02',
      sortOrder: 2,
    },
  });

  const bridgeDeck = await prisma.category.create({
    data: {
      projectId: bridgeProject.id,
      name: 'Deck Installation',
      type: CategoryType.CONSTRUCTION_TYPE,
      code: '03',
      sortOrder: 3,
    },
  });

  // Sub-categories for Foundation
  const excavation = await prisma.category.create({
    data: {
      projectId: bridgeProject.id,
      parentId: bridgeFoundation.id,
      name: 'Excavation',
      type: CategoryType.CATEGORY,
      code: '01-01',
      sortOrder: 1,
    },
  });

  const piling = await prisma.category.create({
    data: {
      projectId: bridgeProject.id,
      parentId: bridgeFoundation.id,
      name: 'Piling',
      type: CategoryType.CATEGORY,
      code: '01-02',
      sortOrder: 2,
    },
  });

  const concreteWork = await prisma.category.create({
    data: {
      projectId: bridgeProject.id,
      parentId: bridgeFoundation.id,
      name: 'Concrete Work',
      type: CategoryType.CATEGORY,
      code: '01-03',
      sortOrder: 3,
    },
  });

  // Road Project Categories
  const roadPreparation = await prisma.category.create({
    data: {
      projectId: roadProject.id,
      name: 'Site Preparation',
      type: CategoryType.CONSTRUCTION_TYPE,
      code: '01',
      sortOrder: 1,
    },
  });

  const roadBase = await prisma.category.create({
    data: {
      projectId: roadProject.id,
      name: 'Base Layer Work',
      type: CategoryType.CONSTRUCTION_TYPE,
      code: '02',
      sortOrder: 2,
    },
  });

  const roadPaving = await prisma.category.create({
    data: {
      projectId: roadProject.id,
      name: 'Asphalt Paving',
      type: CategoryType.CONSTRUCTION_TYPE,
      code: '03',
      sortOrder: 3,
    },
  });

  console.log('Created categories');

  // ==========================================================================
  // Create Blackboard Templates
  // ==========================================================================
  const defaultTemplate = await prisma.blackboardTemplate.create({
    data: {
      organizationId: sampleOrg.id,
      name: 'Default Construction Blackboard',
      isDefault: true,
      fields: {
        fields: [
          { id: 'project_name', label: 'Project Name', type: 'text', required: true },
          { id: 'construction_type', label: 'Construction Type', type: 'text', required: true },
          { id: 'location', label: 'Location', type: 'text', required: false },
          { id: 'date', label: 'Date', type: 'date', required: true },
          { id: 'contractor', label: 'Contractor', type: 'text', required: false },
          { id: 'inspector', label: 'Inspector', type: 'text', required: false },
          { id: 'notes', label: 'Notes', type: 'textarea', required: false },
        ],
      },
    },
  });

  const inspectionTemplate = await prisma.blackboardTemplate.create({
    data: {
      organizationId: sampleOrg.id,
      name: 'Inspection Blackboard',
      isDefault: false,
      fields: {
        fields: [
          { id: 'inspection_type', label: 'Inspection Type', type: 'select', required: true, options: ['Initial', 'Progress', 'Final'] },
          { id: 'inspector_name', label: 'Inspector Name', type: 'text', required: true },
          { id: 'inspection_date', label: 'Inspection Date', type: 'date', required: true },
          { id: 'result', label: 'Result', type: 'select', required: true, options: ['Pass', 'Fail', 'Pending'] },
          { id: 'comments', label: 'Comments', type: 'textarea', required: false },
        ],
      },
    },
  });

  console.log('Created blackboard templates:', { defaultTemplate, inspectionTemplate });

  // ==========================================================================
  // Create Blackboards
  // ==========================================================================
  const blackboard1 = await prisma.blackboard.create({
    data: {
      projectId: bridgeProject.id,
      templateId: defaultTemplate.id,
      content: {
        project_name: 'Bridge Construction Project',
        construction_type: 'Foundation Work - Excavation',
        location: 'Point A - North Bank',
        date: '2025-01-20',
        contractor: 'Sample Construction Co.',
        inspector: 'John Smith',
        notes: 'Initial excavation complete',
      },
      position: BlackboardPosition.BOTTOM_RIGHT,
      size: 30,
    },
  });

  const blackboard2 = await prisma.blackboard.create({
    data: {
      projectId: bridgeProject.id,
      templateId: defaultTemplate.id,
      content: {
        project_name: 'Bridge Construction Project',
        construction_type: 'Foundation Work - Piling',
        location: 'Point A - North Bank',
        date: '2025-02-15',
        contractor: 'Sample Construction Co.',
        inspector: 'Jane Doe',
        notes: 'Piling work in progress',
      },
      position: BlackboardPosition.BOTTOM_RIGHT,
      size: 25,
    },
  });

  console.log('Created blackboards:', { blackboard1, blackboard2 });

  // ==========================================================================
  // Create Photos
  // ==========================================================================
  const photo1 = await prisma.photo.create({
    data: {
      projectId: bridgeProject.id,
      categoryId: excavation.id,
      createdById: memberUser.id,
      title: 'Excavation Start',
      description: 'Initial excavation work at the north bank',
      filePath: 'organizations/sample-construction/projects/bridge/photos/originals/photo1.jpg',
      thumbnailPath: 'organizations/sample-construction/projects/bridge/photos/thumbnails/photo1_md.jpg',
      fileSize: BigInt(2500000),
      mimeType: 'image/jpeg',
      width: 4000,
      height: 3000,
      takenAt: new Date('2025-01-20T09:30:00Z'),
      takenLocation: { latitude: 35.6762, longitude: 139.6503 },
      exifData: {
        make: 'Canon',
        model: 'EOS R5',
        focalLength: '24mm',
        aperture: 'f/8',
        iso: 100,
        shutterSpeed: '1/250',
      },
      blackboardId: blackboard1.id,
    },
  });

  const photo2 = await prisma.photo.create({
    data: {
      projectId: bridgeProject.id,
      categoryId: excavation.id,
      createdById: memberUser.id,
      title: 'Excavation Progress',
      description: 'Excavation depth measurement',
      filePath: 'organizations/sample-construction/projects/bridge/photos/originals/photo2.jpg',
      thumbnailPath: 'organizations/sample-construction/projects/bridge/photos/thumbnails/photo2_md.jpg',
      fileSize: BigInt(2800000),
      mimeType: 'image/jpeg',
      width: 4000,
      height: 3000,
      takenAt: new Date('2025-01-22T14:15:00Z'),
      takenLocation: { latitude: 35.6765, longitude: 139.6508 },
      exifData: {
        make: 'Canon',
        model: 'EOS R5',
        focalLength: '35mm',
        aperture: 'f/11',
        iso: 200,
        shutterSpeed: '1/125',
      },
      blackboardId: null,
    },
  });

  const photo3 = await prisma.photo.create({
    data: {
      projectId: bridgeProject.id,
      categoryId: piling.id,
      createdById: memberUser.id,
      title: 'Piling Operation',
      description: 'Steel pile installation',
      filePath: 'organizations/sample-construction/projects/bridge/photos/originals/photo3.jpg',
      thumbnailPath: 'organizations/sample-construction/projects/bridge/photos/thumbnails/photo3_md.jpg',
      fileSize: BigInt(3200000),
      mimeType: 'image/jpeg',
      width: 4000,
      height: 3000,
      takenAt: new Date('2025-02-15T10:00:00Z'),
      takenLocation: { latitude: 35.6770, longitude: 139.6510 },
      exifData: {
        make: 'Sony',
        model: 'A7R IV',
        focalLength: '50mm',
        aperture: 'f/5.6',
        iso: 400,
        shutterSpeed: '1/500',
      },
      blackboardId: blackboard2.id,
    },
  });

  const photo4 = await prisma.photo.create({
    data: {
      projectId: roadProject.id,
      categoryId: roadPreparation.id,
      createdById: memberUser.id,
      title: 'Site Clearing',
      description: 'Initial site clearing for highway extension',
      filePath: 'organizations/sample-construction/projects/road/photos/originals/photo1.jpg',
      thumbnailPath: 'organizations/sample-construction/projects/road/photos/thumbnails/photo1_md.jpg',
      fileSize: BigInt(2100000),
      mimeType: 'image/jpeg',
      width: 3840,
      height: 2160,
      takenAt: new Date('2025-02-05T08:00:00Z'),
      takenLocation: { latitude: 34.6937, longitude: 135.5023 },
      exifData: {
        make: 'Nikon',
        model: 'Z7 II',
        focalLength: '28mm',
        aperture: 'f/8',
        iso: 100,
        shutterSpeed: '1/320',
      },
      blackboardId: null,
    },
  });

  console.log('Created photos:', { photo1, photo2, photo3, photo4 });

  // ==========================================================================
  // Create Albums
  // ==========================================================================
  const foundationAlbum = await prisma.album.create({
    data: {
      projectId: bridgeProject.id,
      name: 'Foundation Work Documentation',
      description: 'Complete documentation of foundation construction phase',
    },
  });

  const inspectionAlbum = await prisma.album.create({
    data: {
      projectId: bridgeProject.id,
      name: 'Inspection Photos',
      description: 'Photos from all inspection visits',
    },
  });

  console.log('Created albums:', { foundationAlbum, inspectionAlbum });

  // ==========================================================================
  // Create Album Photos
  // ==========================================================================
  await prisma.albumPhoto.createMany({
    data: [
      {
        albumId: foundationAlbum.id,
        photoId: photo1.id,
        sortOrder: 1,
      },
      {
        albumId: foundationAlbum.id,
        photoId: photo2.id,
        sortOrder: 2,
      },
      {
        albumId: foundationAlbum.id,
        photoId: photo3.id,
        sortOrder: 3,
      },
      {
        albumId: inspectionAlbum.id,
        photoId: photo1.id,
        sortOrder: 1,
      },
      {
        albumId: inspectionAlbum.id,
        photoId: photo3.id,
        sortOrder: 2,
      },
    ],
  });

  console.log('Created album photos');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

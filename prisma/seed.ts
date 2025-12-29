/**
 * Database Seed Script
 * Creates sample data for development and testing
 *
 * Issue #28: Sample data for full functionality testing
 *
 * Usage: npm run db:seed
 */

import { PrismaClient, PlanType, Role, OrganizationRole, ProjectStatus, ProjectRole, CategoryType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Standard category definitions for construction photo management
 * Based on Japanese construction industry standards (JACIC)
 */
const STANDARD_CATEGORIES = [
  {
    name: 'Chakkou-mae (Before Construction)',
    code: '01',
    type: CategoryType.CONSTRUCTION_TYPE,
    children: [
      { name: 'Site Condition', code: '01-01', type: CategoryType.CATEGORY },
      { name: 'Existing Structures', code: '01-02', type: CategoryType.CATEGORY },
      { name: 'Survey Points', code: '01-03', type: CategoryType.CATEGORY },
    ],
  },
  {
    name: 'Kiso Kouji (Foundation)',
    code: '02',
    type: CategoryType.CONSTRUCTION_TYPE,
    children: [
      { name: 'Excavation', code: '02-01', type: CategoryType.CATEGORY },
      { name: 'Rebar Work', code: '02-02', type: CategoryType.CATEGORY },
      { name: 'Concrete Pouring', code: '02-03', type: CategoryType.CATEGORY },
      { name: 'Backfill', code: '02-04', type: CategoryType.CATEGORY },
    ],
  },
  {
    name: 'Kutai Kouji (Framing)',
    code: '03',
    type: CategoryType.CONSTRUCTION_TYPE,
    children: [
      { name: 'Steel Frame', code: '03-01', type: CategoryType.CATEGORY },
      { name: 'Wood Frame', code: '03-02', type: CategoryType.CATEGORY },
      { name: 'RC Structure', code: '03-03', type: CategoryType.CATEGORY },
    ],
  },
  {
    name: 'Gaiso Kouji (Exterior)',
    code: '04',
    type: CategoryType.CONSTRUCTION_TYPE,
    children: [
      { name: 'Exterior Walls', code: '04-01', type: CategoryType.CATEGORY },
      { name: 'Windows & Doors', code: '04-02', type: CategoryType.CATEGORY },
      { name: 'Roofing', code: '04-03', type: CategoryType.CATEGORY },
    ],
  },
  {
    name: 'Naiso Kouji (Interior)',
    code: '05',
    type: CategoryType.CONSTRUCTION_TYPE,
    children: [
      { name: 'Walls & Partitions', code: '05-01', type: CategoryType.CATEGORY },
      { name: 'Flooring', code: '05-02', type: CategoryType.CATEGORY },
      { name: 'Ceiling', code: '05-03', type: CategoryType.CATEGORY },
    ],
  },
  {
    name: 'Denki Setsubi (Electrical)',
    code: '06',
    type: CategoryType.CONSTRUCTION_TYPE,
    children: [
      { name: 'Wiring', code: '06-01', type: CategoryType.CATEGORY },
      { name: 'Panels & Switches', code: '06-02', type: CategoryType.CATEGORY },
      { name: 'Lighting', code: '06-03', type: CategoryType.CATEGORY },
    ],
  },
  {
    name: 'Haikan Setsubi (Plumbing)',
    code: '07',
    type: CategoryType.CONSTRUCTION_TYPE,
    children: [
      { name: 'Water Supply', code: '07-01', type: CategoryType.CATEGORY },
      { name: 'Drainage', code: '07-02', type: CategoryType.CATEGORY },
      { name: 'Gas Piping', code: '07-03', type: CategoryType.CATEGORY },
    ],
  },
  {
    name: 'Kanryou (Completion)',
    code: '08',
    type: CategoryType.CONSTRUCTION_TYPE,
    children: [
      { name: 'Final Inspection', code: '08-01', type: CategoryType.CATEGORY },
      { name: 'Handover', code: '08-02', type: CategoryType.CATEGORY },
    ],
  },
];

async function main() {
  console.log('Starting database seed...');

  // Clean up existing data (in development only)
  if (process.env.NODE_ENV !== 'production') {
    console.log('Cleaning up existing data...');
    await prisma.albumPhoto.deleteMany();
    await prisma.album.deleteMany();
    await prisma.photo.deleteMany();
    await prisma.blackboard.deleteMany();
    await prisma.blackboardTemplate.deleteMany();
    await prisma.category.deleteMany();
    await prisma.projectMember.deleteMany();
    await prisma.project.deleteMany();
    await prisma.organizationMember.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.verificationToken.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create test organization
  console.log('Creating organization...');
  const organization = await prisma.organization.create({
    data: {
      name: 'Demo Construction Co.',
      slug: 'demo-construction',
      plan: PlanType.PROFESSIONAL,
    },
  });
  console.log(`  Created organization: ${organization.name} (${organization.id})`);

  // Create test users
  console.log('Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: Role.ADMIN,
      emailVerified: new Date(),
    },
  });
  console.log(`  Created admin user: ${adminUser.email}`);

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: 'Manager User',
      password: hashedPassword,
      role: Role.MANAGER,
      emailVerified: new Date(),
    },
  });
  console.log(`  Created manager user: ${managerUser.email}`);

  const memberUser = await prisma.user.create({
    data: {
      email: 'member@example.com',
      name: 'Member User',
      password: hashedPassword,
      role: Role.MEMBER,
      emailVerified: new Date(),
    },
  });
  console.log(`  Created member user: ${memberUser.email}`);

  // Add users to organization
  console.log('Adding users to organization...');
  await prisma.organizationMember.createMany({
    data: [
      {
        organizationId: organization.id,
        userId: adminUser.id,
        role: OrganizationRole.OWNER,
      },
      {
        organizationId: organization.id,
        userId: managerUser.id,
        role: OrganizationRole.ADMIN,
      },
      {
        organizationId: organization.id,
        userId: memberUser.id,
        role: OrganizationRole.MEMBER,
      },
    ],
  });

  // Create test projects
  console.log('Creating projects...');
  const project1 = await prisma.project.create({
    data: {
      organizationId: organization.id,
      name: 'Tokyo Office Building',
      code: 'TOB-2024-001',
      description: 'New 10-story office building construction in Shibuya',
      clientName: 'Tokyo Development Corp.',
      contractorName: 'Demo Construction Co.',
      location: 'Shibuya, Tokyo',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2025-06-30'),
      status: ProjectStatus.ACTIVE,
    },
  });
  console.log(`  Created project: ${project1.name}`);

  const project2 = await prisma.project.create({
    data: {
      organizationId: organization.id,
      name: 'Osaka Residential Complex',
      code: 'ORC-2024-002',
      description: 'Residential complex with 50 units',
      clientName: 'Osaka Housing Authority',
      contractorName: 'Demo Construction Co.',
      location: 'Umeda, Osaka',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-12-31'),
      status: ProjectStatus.ACTIVE,
    },
  });
  console.log(`  Created project: ${project2.name}`);

  const project3 = await prisma.project.create({
    data: {
      organizationId: organization.id,
      name: 'Completed Warehouse',
      code: 'CW-2023-001',
      description: 'Distribution warehouse (completed)',
      clientName: 'Logistics Partner Inc.',
      contractorName: 'Demo Construction Co.',
      location: 'Chiba, Chiba',
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-12-15'),
      status: ProjectStatus.COMPLETED,
    },
  });
  console.log(`  Created project: ${project3.name}`);

  // Add users to projects
  console.log('Adding users to projects...');
  await prisma.projectMember.createMany({
    data: [
      // Project 1
      { projectId: project1.id, userId: adminUser.id, role: ProjectRole.MANAGER },
      { projectId: project1.id, userId: managerUser.id, role: ProjectRole.MANAGER },
      { projectId: project1.id, userId: memberUser.id, role: ProjectRole.MEMBER },
      // Project 2
      { projectId: project2.id, userId: managerUser.id, role: ProjectRole.MANAGER },
      { projectId: project2.id, userId: memberUser.id, role: ProjectRole.MEMBER },
      // Project 3
      { projectId: project3.id, userId: adminUser.id, role: ProjectRole.MANAGER },
    ],
  });

  // Create categories for each project
  console.log('Creating categories...');
  for (const project of [project1, project2, project3]) {
    let sortOrder = 0;
    for (const category of STANDARD_CATEGORIES) {
      const parentCategory = await prisma.category.create({
        data: {
          projectId: project.id,
          name: category.name,
          code: category.code,
          type: category.type,
          sortOrder: sortOrder++,
          isStandard: true,
        },
      });

      // Create child categories
      for (const child of category.children) {
        await prisma.category.create({
          data: {
            projectId: project.id,
            parentId: parentCategory.id,
            name: child.name,
            code: child.code,
            type: child.type,
            sortOrder: sortOrder++,
            isStandard: true,
          },
        });
      }
    }
  }
  console.log('  Created standard categories for all projects');

  // Create blackboard templates
  console.log('Creating blackboard templates...');
  const template1 = await prisma.blackboardTemplate.create({
    data: {
      organizationId: organization.id,
      name: 'Standard Construction',
      isDefault: true,
      fields: {
        layout: 'standard',
        fields: [
          { id: 'projectName', label: 'Project Name', type: 'text', required: true },
          { id: 'location', label: 'Location', type: 'text', required: true },
          { id: 'date', label: 'Date', type: 'date', required: true },
          { id: 'weather', label: 'Weather', type: 'select', options: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'] },
          { id: 'workType', label: 'Work Type', type: 'text', required: true },
          { id: 'contractor', label: 'Contractor', type: 'text' },
          { id: 'supervisor', label: 'Supervisor', type: 'text' },
        ],
      },
    },
  });
  console.log(`  Created template: ${template1.name}`);

  const template2 = await prisma.blackboardTemplate.create({
    data: {
      organizationId: organization.id,
      name: 'Inspection Record',
      isDefault: false,
      fields: {
        layout: 'inspection',
        fields: [
          { id: 'inspectionType', label: 'Inspection Type', type: 'text', required: true },
          { id: 'date', label: 'Date', type: 'date', required: true },
          { id: 'inspector', label: 'Inspector', type: 'text', required: true },
          { id: 'result', label: 'Result', type: 'select', options: ['Pass', 'Fail', 'Conditional'] },
          { id: 'notes', label: 'Notes', type: 'textarea' },
        ],
      },
    },
  });
  console.log(`  Created template: ${template2.name}`);

  // Create sample albums for project 1
  console.log('Creating albums...');
  const album1 = await prisma.album.create({
    data: {
      projectId: project1.id,
      name: 'Foundation Work - January 2024',
      description: 'Photos from foundation excavation and concrete work',
    },
  });
  console.log(`  Created album: ${album1.name}`);

  const album2 = await prisma.album.create({
    data: {
      projectId: project1.id,
      name: 'Steel Frame Erection',
      description: 'Steel frame installation progress',
    },
  });
  console.log(`  Created album: ${album2.name}`);

  // Print summary
  console.log('\n=== Seed Complete ===');
  console.log('\nTest Accounts:');
  console.log('  Admin:   admin@example.com / password123');
  console.log('  Manager: manager@example.com / password123');
  console.log('  Member:  member@example.com / password123');
  console.log('\nCreated:');
  console.log('  - 1 Organization');
  console.log('  - 3 Users');
  console.log('  - 3 Projects');
  console.log('  - Standard categories for each project');
  console.log('  - 2 Blackboard templates');
  console.log('  - 2 Albums');
  console.log('\nYou can now login and test the application!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

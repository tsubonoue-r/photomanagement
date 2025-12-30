import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'e2e-test@example.com';
  const password = 'E2ETestPassword123!';
  const name = 'E2E Test User';

  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Deleting existing test user:', email);
    await prisma.user.delete({ where: { email } });
  }

  // Hash password (use 12 rounds to match auth.ts)
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
    },
  });

  console.log('Created test user:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

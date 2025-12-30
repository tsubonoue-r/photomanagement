import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'e2e-test@example.com';
  const password = 'E2ETestPassword123!';

  // Get user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found:', email);
    return;
  }

  console.log('User found:', user.email);
  console.log('Password hash:', user.password?.substring(0, 20) + '...');

  if (!user.password) {
    console.log('User has no password set!');
    return;
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);
  console.log('Password valid:', isValid);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

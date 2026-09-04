import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

const email = process.env.ADMIN_EMAIL ?? 'admin.test@example.com';
const username =
  process.env.ADMIN_USERNAME ??
  email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
const password = process.env.ADMIN_PASSWORD ?? 'AdminTest123!';
const fullName = process.env.ADMIN_FULL_NAME ?? 'Test Administrator';

async function main() {
  if (password.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters long.');
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error(
      `A user with ${email} already exists. Set ADMIN_EMAIL to another address; no existing data was changed.`,
    );
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    throw new Error(
      `A user with username ${username} already exists. Set ADMIN_USERNAME to another value; no existing data was changed.`,
    );
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });
  if (!adminRole) {
    throw new Error(
      'The admin role does not exist. Run "pnpm prisma:seed" first, then run this script again.',
    );
  }

  const hashedPassword = await hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      username,
      full_name: fullName,
      password: hashedPassword,
      isAdmin: true,
      userRoles: {
        create: { roleId: adminRole.id },
      },
    },
    select: { id: true, email: true, username: true, isAdmin: true },
  });

  console.log('Admin account created successfully.');
  console.log(`Email: ${user.email}`);
  console.log(`Username: ${user.username}`);
  console.log(`Password: ${password}`);
  console.log(`isAdmin: ${user.isAdmin}`);
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

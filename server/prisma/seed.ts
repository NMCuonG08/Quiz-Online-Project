import { PrismaClient } from '@prisma/client';

// Define Permission constants locally to avoid import issues
const Permission = {
  All: 'all',
  ActivityCreate: 'activity.create',
  ActivityRead: 'activity.read',
  ActivityUpdate: 'activity.update',
  ActivityDelete: 'activity.delete',
  ActivityStatistics: 'activity.statistics',
  ApiKeyCreate: 'apiKey.create',
  ApiKeyRead: 'apiKey.read',
  ApiKeyUpdate: 'apiKey.update',
  ApiKeyDelete: 'apiKey.delete',
  AssetRead: 'asset.read',
  AssetUpdate: 'asset.update',
  AssetDelete: 'asset.delete',
  AssetStatistics: 'asset.statistics',
  AssetShare: 'asset.share',
  AssetView: 'asset.view',
  AssetDownload: 'asset.download',
  AssetUpload: 'asset.upload',
  AssetReplace: 'asset.replace',
  QuizCreate: 'quiz.create',
  QuizRead: 'quiz.read',
  QuizUpdate: 'quiz.update',
  QuizDelete: 'quiz.delete',
  QuizStatistics: 'quiz.statistics',
} as const;

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting RBAC seeding...');

  // Create all permissions
  console.log('📝 Creating permissions...');

  const permissions = (Object.values(Permission) as string[]).map(
    (permission: string) => ({
      key: permission,
      description: getPermissionDescription(permission),
    }),
  );

  // Use upsert to avoid duplicates
  for (const permission of permissions) {
    await prisma.appPermission.upsert({
      where: { key: permission.key },
      update: { description: permission.description },
      create: permission,
    });
  }

  console.log(`✅ Created ${permissions.length} permissions`);

  // Create user role
  console.log('👤 Creating user role...');

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: { description: 'Regular user with basic permissions' },
    create: {
      name: 'user',
      description: 'Regular user with basic permissions',
    },
  });

  // Assign basic permissions to user role
  const userPermissions = [
    Permission.ActivityRead,
    Permission.AssetRead,
    Permission.AssetView,
    Permission.AssetDownload,
    Permission.AssetUpload,
    Permission.QuizRead,
  ];

  await assignPermissionsToRole(userRole.id, userPermissions);
  console.log(
    `✅ User role created with ${userPermissions.length} permissions`,
  );

  // Create admin role
  console.log('👑 Creating admin role...');

  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: { description: 'Administrator with all permissions' },
    create: {
      name: 'admin',
      description: 'Administrator with all permissions',
    },
  });

  // Assign all permissions to admin role
  const allPermissions = Object.values(Permission) as string[];
  await assignPermissionsToRole(adminRole.id, allPermissions);
  console.log(
    `✅ Admin role created with ${allPermissions.length} permissions`,
  );

  console.log('✅ RBAC seeding completed!');
}

async function assignPermissionsToRole(
  roleId: string,
  permissionKeys: string[],
) {
  // Get permission IDs
  const permissions = await prisma.appPermission.findMany({
    where: { key: { in: permissionKeys } },
    select: { id: true },
  });

  const permissionIds = permissions.map((p) => p.id);

  // Remove existing permissions for this role
  await prisma.rolePermission.deleteMany({
    where: { roleId },
  });

  // Create new role permissions
  const rolePermissions = permissionIds.map((permissionId) => ({
    roleId,
    permissionId,
  }));

  await prisma.rolePermission.createMany({
    data: rolePermissions,
  });
}

function getPermissionDescription(permission: string): string {
  const descriptions: Record<string, string> = {
    [Permission.All]: 'All permissions',

    // Activity permissions
    [Permission.ActivityCreate]: 'Create activity logs',
    [Permission.ActivityRead]: 'Read activity logs',
    [Permission.ActivityUpdate]: 'Update activity logs',
    [Permission.ActivityDelete]: 'Delete activity logs',
    [Permission.ActivityStatistics]: 'View activity statistics',

    // API Key permissions
    [Permission.ApiKeyCreate]: 'Create API keys',
    [Permission.ApiKeyRead]: 'Read API keys',
    [Permission.ApiKeyUpdate]: 'Update API keys',
    [Permission.ApiKeyDelete]: 'Delete API keys',

    // Asset permissions
    [Permission.AssetRead]: 'Read assets',
    [Permission.AssetUpdate]: 'Update assets',
    [Permission.AssetDelete]: 'Delete assets',
    [Permission.AssetStatistics]: 'View asset statistics',
    [Permission.AssetShare]: 'Share assets',
    [Permission.AssetView]: 'View assets',
    [Permission.AssetDownload]: 'Download assets',
    [Permission.AssetUpload]: 'Upload assets',
    [Permission.AssetReplace]: 'Replace assets',

    // Quiz permissions
    [Permission.QuizCreate]: 'Create quizzes',
    [Permission.QuizRead]: 'Read quizzes',
    [Permission.QuizUpdate]: 'Update quizzes',
    [Permission.QuizDelete]: 'Delete quizzes',
    [Permission.QuizStatistics]: 'View quiz statistics',
  };

  return descriptions[permission] || `Permission to ${permission}`;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

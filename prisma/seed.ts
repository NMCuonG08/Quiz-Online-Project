import { PrismaClient } from '@prisma/client';
import { Permission } from '../src/common/enums/permisson';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting RBAC seeding...');

  // Create all permissions
  console.log('📝 Creating permissions...');

  const permissions = Object.values(Permission).map((permission) => ({
    key: permission,
    description: getPermissionDescription(permission),
  }));

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
    Permission.AssetRead,
    Permission.AssetView,
    Permission.AssetDownload,
    Permission.AssetUpload,
    Permission.AssetShare,
    Permission.AlbumRead,
    Permission.AlbumCreate,
    Permission.AlbumUpdate,
    Permission.AlbumDelete,
    Permission.AlbumShare,
    Permission.AlbumDownload,
    Permission.AlbumAssetCreate,
    Permission.AlbumAssetDelete,
    Permission.AlbumUserCreate,
    Permission.AlbumUserUpdate,
    Permission.AlbumUserDelete,
    Permission.AuthChangePassword,
    Permission.AuthDeviceDelete,
    Permission.FaceRead,
    Permission.FaceCreate,
    Permission.FaceUpdate,
    Permission.FaceDelete,
    Permission.LibraryRead,
    Permission.LibraryCreate,
    Permission.LibraryUpdate,
    Permission.LibraryDelete,
    Permission.MemoryRead,
    Permission.MemoryCreate,
    Permission.MemoryUpdate,
    Permission.MemoryDelete,
    Permission.MemoryAssetCreate,
    Permission.MemoryAssetDelete,
    Permission.NotificationRead,
    Permission.NotificationUpdate,
    Permission.PersonRead,
    Permission.PersonCreate,
    Permission.PersonUpdate,
    Permission.PersonDelete,
    Permission.PersonReassign,
    Permission.SessionCreate,
    Permission.SessionRead,
    Permission.SessionUpdate,
    Permission.SessionDelete,
    Permission.SessionLock,
    Permission.SharedLinkCreate,
    Permission.SharedLinkRead,
    Permission.SharedLinkUpdate,
    Permission.SharedLinkDelete,
    Permission.StackCreate,
    Permission.StackRead,
    Permission.StackUpdate,
    Permission.StackDelete,
    Permission.TagCreate,
    Permission.TagRead,
    Permission.TagUpdate,
    Permission.TagDelete,
    Permission.TagAsset,
    Permission.UserRead,
    Permission.UserUpdate,
    Permission.UserOnboardingRead,
    Permission.UserOnboardingUpdate,
    Permission.UserOnboardingDelete,
    Permission.UserPreferenceRead,
    Permission.UserPreferenceUpdate,
    Permission.UserProfileImageCreate,
    Permission.UserProfileImageRead,
    Permission.UserProfileImageUpdate,
    Permission.UserProfileImageDelete,
    Permission.TimelineRead,
    Permission.TimelineDownload,
    Permission.DuplicateRead,
    Permission.DuplicateDelete,
    Permission.ArchiveRead,
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
  const allPermissions = Object.values(Permission);
  await assignPermissionsToRole(adminRole.id, allPermissions);
  console.log(
    `✅ Admin role created with ${allPermissions.length} permissions`,
  );

  console.log('✅ RBAC seeding completed!');
  console.log(`✅ User Role ID: ${userRole.id}`);
  console.log(`✅ Admin Role ID: ${adminRole.id}`);
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

  // Delete existing role permissions
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

    // Album permissions
    [Permission.AlbumCreate]: 'Create albums',
    [Permission.AlbumRead]: 'Read albums',
    [Permission.AlbumUpdate]: 'Update albums',
    [Permission.AlbumDelete]: 'Delete albums',
    [Permission.AlbumStatistics]: 'View album statistics',
    [Permission.AlbumShare]: 'Share albums',
    [Permission.AlbumDownload]: 'Download albums',

    // Album Asset permissions
    [Permission.AlbumAssetCreate]: 'Add assets to albums',
    [Permission.AlbumAssetDelete]: 'Remove assets from albums',

    // Album User permissions
    [Permission.AlbumUserCreate]: 'Add users to albums',
    [Permission.AlbumUserUpdate]: 'Update album user permissions',
    [Permission.AlbumUserDelete]: 'Remove users from albums',

    // Auth permissions
    [Permission.AuthChangePassword]: 'Change password',
    [Permission.AuthDeviceDelete]: 'Delete auth devices',

    // Archive permissions
    [Permission.ArchiveRead]: 'Read archived content',

    // Duplicate permissions
    [Permission.DuplicateRead]: 'Read duplicate detection results',
    [Permission.DuplicateDelete]: 'Delete duplicate assets',

    // Face permissions
    [Permission.FaceCreate]: 'Create face recognition data',
    [Permission.FaceRead]: 'Read face recognition data',
    [Permission.FaceUpdate]: 'Update face recognition data',
    [Permission.FaceDelete]: 'Delete face recognition data',

    // Job permissions
    [Permission.JobCreate]: 'Create background jobs',
    [Permission.JobRead]: 'Read job status',

    // Library permissions
    [Permission.LibraryCreate]: 'Create libraries',
    [Permission.LibraryRead]: 'Read libraries',
    [Permission.LibraryUpdate]: 'Update libraries',
    [Permission.LibraryDelete]: 'Delete libraries',
    [Permission.LibraryStatistics]: 'View library statistics',

    // Timeline permissions
    [Permission.TimelineRead]: 'Read timeline',
    [Permission.TimelineDownload]: 'Download timeline',

    // Memory permissions
    [Permission.MemoryCreate]: 'Create memories',
    [Permission.MemoryRead]: 'Read memories',
    [Permission.MemoryUpdate]: 'Update memories',
    [Permission.MemoryDelete]: 'Delete memories',
    [Permission.MemoryStatistics]: 'View memory statistics',

    // Memory Asset permissions
    [Permission.MemoryAssetCreate]: 'Add assets to memories',
    [Permission.MemoryAssetDelete]: 'Remove assets from memories',

    // Notification permissions
    [Permission.NotificationCreate]: 'Create notifications',
    [Permission.NotificationRead]: 'Read notifications',
    [Permission.NotificationUpdate]: 'Update notifications',
    [Permission.NotificationDelete]: 'Delete notifications',

    // Partner permissions
    [Permission.PartnerCreate]: 'Create partner accounts',
    [Permission.PartnerRead]: 'Read partner accounts',
    [Permission.PartnerUpdate]: 'Update partner accounts',
    [Permission.PartnerDelete]: 'Delete partner accounts',

    // Person permissions
    [Permission.PersonCreate]: 'Create person profiles',
    [Permission.PersonRead]: 'Read person profiles',
    [Permission.PersonUpdate]: 'Update person profiles',
    [Permission.PersonDelete]: 'Delete person profiles',
    [Permission.PersonStatistics]: 'View person statistics',
    [Permission.PersonMerge]: 'Merge person profiles',
    [Permission.PersonReassign]: 'Reassign person assets',

    // Pin Code permissions
    [Permission.PinCodeCreate]: 'Create pin codes',
    [Permission.PinCodeUpdate]: 'Update pin codes',
    [Permission.PinCodeDelete]: 'Delete pin codes',

    // Server permissions
    [Permission.ServerAbout]: 'View server information',
    [Permission.ServerApkLinks]: 'View APK download links',
    [Permission.ServerStorage]: 'View server storage info',
    [Permission.ServerStatistics]: 'View server statistics',
    [Permission.ServerVersionCheck]: 'Check server version',

    // Server License permissions
    [Permission.ServerLicenseRead]: 'Read server license',
    [Permission.ServerLicenseUpdate]: 'Update server license',
    [Permission.ServerLicenseDelete]: 'Delete server license',

    // Session permissions
    [Permission.SessionCreate]: 'Create sessions',
    [Permission.SessionRead]: 'Read sessions',
    [Permission.SessionUpdate]: 'Update sessions',
    [Permission.SessionDelete]: 'Delete sessions',
    [Permission.SessionLock]: 'Lock sessions',

    // Shared Link permissions
    [Permission.SharedLinkCreate]: 'Create shared links',
    [Permission.SharedLinkRead]: 'Read shared links',
    [Permission.SharedLinkUpdate]: 'Update shared links',
    [Permission.SharedLinkDelete]: 'Delete shared links',

    // Stack permissions
    [Permission.StackCreate]: 'Create stacks',
    [Permission.StackRead]: 'Read stacks',
    [Permission.StackUpdate]: 'Update stacks',
    [Permission.StackDelete]: 'Delete stacks',

    // Sync permissions
    [Permission.SyncStream]: 'Stream sync data',
    [Permission.SyncCheckpointRead]: 'Read sync checkpoints',
    [Permission.SyncCheckpointUpdate]: 'Update sync checkpoints',
    [Permission.SyncCheckpointDelete]: 'Delete sync checkpoints',

    // System Config permissions
    [Permission.SystemConfigRead]: 'Read system configuration',
    [Permission.SystemConfigUpdate]: 'Update system configuration',

    // System Metadata permissions
    [Permission.SystemMetadataRead]: 'Read system metadata',
    [Permission.SystemMetadataUpdate]: 'Update system metadata',

    // Tag permissions
    [Permission.TagCreate]: 'Create tags',
    [Permission.TagRead]: 'Read tags',
    [Permission.TagUpdate]: 'Update tags',
    [Permission.TagDelete]: 'Delete tags',
    [Permission.TagAsset]: 'Tag assets',

    // User permissions
    [Permission.UserRead]: 'Read user profiles',
    [Permission.UserUpdate]: 'Update user profiles',

    // User License permissions
    [Permission.UserLicenseCreate]: 'Create user licenses',
    [Permission.UserLicenseRead]: 'Read user licenses',
    [Permission.UserLicenseUpdate]: 'Update user licenses',
    [Permission.UserLicenseDelete]: 'Delete user licenses',

    // User Onboarding permissions
    [Permission.UserOnboardingRead]: 'Read user onboarding data',
    [Permission.UserOnboardingUpdate]: 'Update user onboarding data',
    [Permission.UserOnboardingDelete]: 'Delete user onboarding data',

    // User Preference permissions
    [Permission.UserPreferenceRead]: 'Read user preferences',
    [Permission.UserPreferenceUpdate]: 'Update user preferences',

    // User Profile Image permissions
    [Permission.UserProfileImageCreate]: 'Create user profile images',
    [Permission.UserProfileImageRead]: 'Read user profile images',
    [Permission.UserProfileImageUpdate]: 'Update user profile images',
    [Permission.UserProfileImageDelete]: 'Delete user profile images',

    // Admin User permissions
    [Permission.AdminUserCreate]: 'Create admin users',
    [Permission.AdminUserRead]: 'Read admin users',
    [Permission.AdminUserUpdate]: 'Update admin users',
    [Permission.AdminUserDelete]: 'Delete admin users',

    // Admin Auth permissions
    [Permission.AdminAuthUnlinkAll]: 'Unlink all auth providers',
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

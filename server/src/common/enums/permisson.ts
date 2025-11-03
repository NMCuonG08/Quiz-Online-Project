export enum Permission {
  All = 'all',

  ActivityCreate = 'activity.create',
  ActivityRead = 'activity.read',
  ActivityUpdate = 'activity.update',
  ActivityDelete = 'activity.delete',
  ActivityStatistics = 'activity.statistics',

  ApiKeyCreate = 'apiKey.create',
  ApiKeyRead = 'apiKey.read',
  ApiKeyUpdate = 'apiKey.update',
  ApiKeyDelete = 'apiKey.delete',

  // ASSET_CREATE = 'asset.create',
  AssetRead = 'asset.read',
  AssetUpdate = 'asset.update',
  AssetDelete = 'asset.delete',
  AssetStatistics = 'asset.statistics',
  AssetShare = 'asset.share',
  AssetView = 'asset.view',
  AssetDownload = 'asset.download',
  AssetUpload = 'asset.upload',
  AssetReplace = 'asset.replace',

  QuizCreate = 'quiz.create',
  QuizRead = 'quiz.read',
  QuizUpdate = 'quiz.update',
  QuizDelete = 'quiz.delete',
  QuizStatistics = 'quiz.statistics',
  QuizShare = 'quiz.share',
  AlbumDownload = 'album.download',

  AlbumAssetCreate = 'albumAsset.create',
  AlbumAssetDelete = 'albumAsset.delete',

  AlbumUserCreate = 'albumUser.create',
  AlbumUserUpdate = 'albumUser.update',
  AlbumUserDelete = 'albumUser.delete',

  AuthChangePassword = 'auth.changePassword',

  AuthDeviceDelete = 'authDevice.delete',

  ArchiveRead = 'archive.read',

  DuplicateRead = 'duplicate.read',
  DuplicateDelete = 'duplicate.delete',

  FaceCreate = 'face.create',
  FaceRead = 'face.read',
  FaceUpdate = 'face.update',
  FaceDelete = 'face.delete',

  JobCreate = 'job.create',
  JobRead = 'job.read',

  LibraryCreate = 'library.create',
  LibraryRead = 'library.read',
  LibraryUpdate = 'library.update',
  LibraryDelete = 'library.delete',
  LibraryStatistics = 'library.statistics',

  TimelineRead = 'timeline.read',
  TimelineDownload = 'timeline.download',

  MemoryCreate = 'memory.create',
  MemoryRead = 'memory.read',
  MemoryUpdate = 'memory.update',
  MemoryDelete = 'memory.delete',
  MemoryStatistics = 'memory.statistics',

  MemoryAssetCreate = 'memoryAsset.create',
  MemoryAssetDelete = 'memoryAsset.delete',

  NotificationCreate = 'notification.create',
  NotificationRead = 'notification.read',
  NotificationUpdate = 'notification.update',
  NotificationDelete = 'notification.delete',

  PartnerCreate = 'partner.create',
  PartnerRead = 'partner.read',
  PartnerUpdate = 'partner.update',
  PartnerDelete = 'partner.delete',

  PersonCreate = 'person.create',
  PersonRead = 'person.read',
  PersonUpdate = 'person.update',
  PersonDelete = 'person.delete',
  PersonStatistics = 'person.statistics',
  PersonMerge = 'person.merge',
  PersonReassign = 'person.reassign',

  PinCodeCreate = 'pinCode.create',
  PinCodeUpdate = 'pinCode.update',
  PinCodeDelete = 'pinCode.delete',

  ServerAbout = 'server.about',
  ServerApkLinks = 'server.apkLinks',
  ServerStorage = 'server.storage',
  ServerStatistics = 'server.statistics',
  ServerVersionCheck = 'server.versionCheck',

  ServerLicenseRead = 'serverLicense.read',
  ServerLicenseUpdate = 'serverLicense.update',
  ServerLicenseDelete = 'serverLicense.delete',

  SessionCreate = 'session.create',
  SessionRead = 'session.read',
  SessionUpdate = 'session.update',
  SessionDelete = 'session.delete',
  SessionLock = 'session.lock',

  SharedLinkCreate = 'sharedLink.create',
  SharedLinkRead = 'sharedLink.read',
  SharedLinkUpdate = 'sharedLink.update',
  SharedLinkDelete = 'sharedLink.delete',

  StackCreate = 'stack.create',
  StackRead = 'stack.read',
  StackUpdate = 'stack.update',
  StackDelete = 'stack.delete',

  SyncStream = 'sync.stream',
  SyncCheckpointRead = 'syncCheckpoint.read',
  SyncCheckpointUpdate = 'syncCheckpoint.update',
  SyncCheckpointDelete = 'syncCheckpoint.delete',

  SystemConfigRead = 'systemConfig.read',
  SystemConfigUpdate = 'systemConfig.update',

  SystemMetadataRead = 'systemMetadata.read',
  SystemMetadataUpdate = 'systemMetadata.update',

  TagCreate = 'tag.create',
  TagRead = 'tag.read',
  TagUpdate = 'tag.update',
  TagDelete = 'tag.delete',
  TagAsset = 'tag.asset',

  UserRead = 'user.read',
  UserUpdate = 'user.update',

  UserLicenseCreate = 'userLicense.create',
  UserLicenseRead = 'userLicense.read',
  UserLicenseUpdate = 'userLicense.update',
  UserLicenseDelete = 'userLicense.delete',

  UserOnboardingRead = 'userOnboarding.read',
  UserOnboardingUpdate = 'userOnboarding.update',
  UserOnboardingDelete = 'userOnboarding.delete',

  UserPreferenceRead = 'userPreference.read',
  UserPreferenceUpdate = 'userPreference.update',

  UserProfileImageCreate = 'userProfileImage.create',
  UserProfileImageRead = 'userProfileImage.read',
  UserProfileImageUpdate = 'userProfileImage.update',
  UserProfileImageDelete = 'userProfileImage.delete',

  AdminUserCreate = 'adminUser.create',
  AdminUserRead = 'adminUser.read',
  AdminUserUpdate = 'adminUser.update',
  AdminUserDelete = 'adminUser.delete',

  AdminAuthUnlinkAll = 'adminAuth.unlinkAll',
}

export enum MetadataKey {
  AuthRoute = 'auth_route',
  AdminRoute = 'admin_route',
  SharedRoute = 'shared_route',
  ApiKeySecurity = 'api_key',
  EventConfig = 'event_config',
  JobConfig = 'job_config',
  TelemetryEnabled = 'telemetry_enabled',
}
export enum ApiCustomExtension {
  Permission = 'x-project-permission',
  AdminOnly = 'x-project-admin-only',
}
export enum projectQuery {
  SharedLinkKey = 'key',
  SharedLinkSlug = 'slug',
  ApiKey = 'apiKey',
  SessionKey = 'sessionKey',
}
export enum OAuthTokenEndpointAuthMethod {
  ClientSecretPost = 'client_secret_post',
  ClientSecretBasic = 'client_secret_basic',
}

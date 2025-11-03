export enum CacheEventType {
  // Category cache events
  CategoryCreated = 'CategoryCacheInvalidated',
  CategoryUpdated = 'CategoryCacheInvalidated',
  CategoryDeleted = 'CategoryCacheInvalidated',
  CategoryAllInvalidated = 'CategoryAllCacheInvalidated',

  // Notification cache events
  NotificationCreated = 'NotificationCacheInvalidated',
  NotificationUpdated = 'NotificationCacheInvalidated',
  NotificationDeleted = 'NotificationCacheInvalidated',
  NotificationMarkedAsRead = 'NotificationCacheInvalidated',
  NotificationMarkedAsArchived = 'NotificationCacheInvalidated',
  NotificationAllRead = 'NotificationCacheInvalidated',
  NotificationAllInvalidated = 'NotificationAllCacheInvalidated',
  NotificationUserInvalidated = 'NotificationUserCacheInvalidated',
  NotificationUnreadInvalidated = 'NotificationUnreadCacheInvalidated',

  // Auth cache events
  UserCacheInvalidated = 'UserCacheInvalidated',
  TokenCacheInvalidated = 'TokenCacheInvalidated',
  PermissionCacheInvalidated = 'PermissionCacheInvalidated',
  RoleCacheInvalidated = 'RoleCacheInvalidated',

  // Generic cache event
  CustomCacheInvalidated = 'CustomCacheInvalidated',
}

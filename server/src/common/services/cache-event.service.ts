import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@/infrastructure/cache/redis/redis.service';
import { CacheEventType } from '../enums/cache.events';
import { OnEvent } from '../decorators';
import { ArgOf } from '../repositories/event.repository';

export interface CacheInvalidationPayload {
  keys: string | string[];
  userId?: string;
  notificationId?: string;
  categoryId?: string;
  [key: string]: any;
}

@Injectable()
export class CacheEventService {
  private readonly logger = new Logger(CacheEventService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Handle category cache invalidation events
   */
  @OnEvent({ name: 'CategoryCacheInvalidated', priority: 1 })
  async handleCategoryCacheInvalidated(
    payload: ArgOf<'CategoryCacheInvalidated'>,
  ) {
    this.logger.debug(
      `Invalidating category cache: ${JSON.stringify(payload)}`,
    );
    const keys = payload.keys;
    if (Array.isArray(keys)) {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated ${keys.length} category cache keys`);
    } else {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated category cache key: ${keys}`);
    }
  }

  /**
   * Handle notification cache invalidation events
   */
  @OnEvent({ name: 'NotificationCacheInvalidated', priority: 1 })
  async handleNotificationCacheInvalidated(
    payload: ArgOf<'NotificationCacheInvalidated'>,
  ) {
    this.logger.debug(
      `Invalidating notification cache: ${JSON.stringify(payload)}`,
    );
    const keys = payload.keys;
    if (Array.isArray(keys)) {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated ${keys.length} notification cache keys`);
    } else {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated notification cache key: ${keys}`);
    }
  }

  /**
   * Handle all notification cache invalidation event
   */
  @OnEvent({ name: 'NotificationAllCacheInvalidated', priority: 1 })
  async handleNotificationAllCacheInvalidated(
    payload: ArgOf<'NotificationAllCacheInvalidated'>,
  ) {
    this.logger.debug(`Invalidating all notification cache`);
    const keys = payload.keys;
    if (Array.isArray(keys)) {
      for (const key of keys) {
        await this.redisService.del(key);
      }
      this.logger.log(`Invalidated ${keys.length} notification cache keys`);
    } else {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated notification cache key: ${keys}`);
    }
  }

  /**
   * Handle user-specific notification cache invalidation
   */
  @OnEvent({ name: 'NotificationUserCacheInvalidated', priority: 1 })
  async handleNotificationUserCacheInvalidated(
    payload: ArgOf<'NotificationUserCacheInvalidated'>,
  ) {
    this.logger.debug(
      `Invalidating user notification cache for userId: ${payload.userId}`,
    );
    const keys = payload.keys;
    if (Array.isArray(keys)) {
      await this.redisService.del(keys);
      this.logger.log(
        `Invalidated ${keys.length} user notification cache keys for user ${payload.userId}`,
      );
    } else {
      await this.redisService.del(keys);
      this.logger.log(
        `Invalidated user notification cache key: ${keys} for user ${payload.userId}`,
      );
    }
  }

  /**
   * Handle unread notification cache invalidation
   */
  @OnEvent({ name: 'NotificationUnreadCacheInvalidated', priority: 1 })
  async handleNotificationUnreadCacheInvalidated(
    payload: ArgOf<'NotificationUnreadCacheInvalidated'>,
  ) {
    this.logger.debug(
      `Invalidating unread notification cache for userId: ${payload.userId}`,
    );
    const keys = payload.keys;
    if (Array.isArray(keys)) {
      await this.redisService.del(keys);
      this.logger.log(
        `Invalidated ${keys.length} unread notification cache keys for user ${payload.userId}`,
      );
    } else {
      await this.redisService.del(keys);
      this.logger.log(
        `Invalidated unread notification cache key: ${keys} for user ${payload.userId}`,
      );
    }
  }

  /**
   * Handle auth cache invalidation events
   */
  @OnEvent({ name: 'UserCacheInvalidated', priority: 1 })
  async handleUserCacheInvalidated(payload: ArgOf<'UserCacheInvalidated'>) {
    this.logger.debug(`Invalidating user cache for userId: ${payload.userId}`);
    const keys = payload.keys;
    if (Array.isArray(keys)) {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated ${keys.length} user cache keys`);
    } else {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated user cache key: ${keys}`);
    }
  }

  /**
   * Handle token cache invalidation
   */
  @OnEvent({ name: 'TokenCacheInvalidated', priority: 1 })
  async handleTokenCacheInvalidated(payload: ArgOf<'TokenCacheInvalidated'>) {
    this.logger.debug('Invalidating token cache');
    const keys = payload.keys;
    if (Array.isArray(keys)) {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated ${keys.length} token cache keys`);
    } else {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated token cache key: ${keys}`);
    }
  }

  /**
   * Handle custom cache invalidation events
   */
  @OnEvent({ name: 'CustomCacheInvalidated', priority: 1 })
  async handleCustomCacheInvalidated(payload: ArgOf<'CustomCacheInvalidated'>) {
    this.logger.debug(`Invalidating custom cache: ${JSON.stringify(payload)}`);
    const keys = payload.keys;
    if (Array.isArray(keys)) {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated ${keys.length} custom cache keys`);
    } else {
      await this.redisService.del(keys);
      this.logger.log(`Invalidated custom cache key: ${keys}`);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@/infrastructure/cache/redis/redis.service';
import { AuthDto } from '../dto';
import { Permission } from '@/common/enums';

@Injectable()
export class AuthCacheService {
  private readonly logger = new Logger(AuthCacheService.name);
  private readonly CACHE_TTL = 15 * 60; // 15 minutes
  private readonly USER_CACHE_TTL = 30 * 60; // 30 minutes

  constructor(private readonly redisService: RedisService) {}

  // Cache auth data by token with JWT expiration time
  async cacheAuthData(
    token: string,
    authData: AuthDto,
    jwtExpiresAt: number,
  ): Promise<void> {
    try {
      const key = `auth:token:${token}`;
      // Calculate TTL based on JWT expiration time minus 30 seconds buffer
      const now = Math.floor(Date.now() / 1000);
      const ttl = Math.max(jwtExpiresAt - now - 30, 60); // At least 1 minute

      await this.redisService.set(key, authData, ttl);
      this.logger.debug(
        `Cached auth data for token with TTL: ${ttl}s (expires at: ${new Date(jwtExpiresAt * 1000).toISOString()})`,
      );
    } catch (error) {
      this.logger.error('Failed to cache auth data:', error);
    }
  }

  // Get cached auth data
  async getCachedAuthData(token: string): Promise<AuthDto | null> {
    try {
      const key = `auth:token:${token}`;
      return await this.redisService.get<AuthDto>(key);
    } catch (error) {
      this.logger.error('Failed to get cached auth data:', error);
      return null;
    }
  }

  // Cache user permissions
  async cacheUserPermissions(
    userId: string,
    permissions: Permission[],
  ): Promise<void> {
    try {
      const key = `auth:permissions:${userId}`;
      await this.redisService.set(key, permissions, this.USER_CACHE_TTL);
      this.logger.debug(`Cached permissions for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to cache permissions for user ${userId}:`,
        error,
      );
    }
  }

  // Get cached user permissions
  async getCachedUserPermissions(userId: string): Promise<Permission[] | null> {
    try {
      const key = `auth:permissions:${userId}`;
      return await this.redisService.get<Permission[]>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get cached permissions for user ${userId}:`,
        error,
      );
      return null;
    }
  }

  // Cache user roles
  async cacheUserRoles(userId: string, roles: string[]): Promise<void> {
    try {
      const key = `auth:roles:${userId}`;
      await this.redisService.set(key, roles, this.USER_CACHE_TTL);
      this.logger.debug(`Cached roles for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to cache roles for user ${userId}:`, error);
    }
  }

  // Get cached user roles
  async getCachedUserRoles(userId: string): Promise<string[] | null> {
    try {
      const key = `auth:roles:${userId}`;
      return await this.redisService.get<string[]>(key);
    } catch (error) {
      this.logger.error(
        `Failed to get cached roles for user ${userId}:`,
        error,
      );
      return null;
    }
  }

  // Invalidate user cache
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      const keys = [`auth:permissions:${userId}`, `auth:roles:${userId}`];
      await this.redisService.del(keys);
      this.logger.debug(`Invalidated cache for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache for user ${userId}:`,
        error,
      );
    }
  }

  // Invalidate token cache
  async invalidateTokenCache(token: string): Promise<void> {
    try {
      const key = `auth:token:${token}`;
      await this.redisService.del(key);
      this.logger.debug('Invalidated token cache');
    } catch (error) {
      this.logger.error('Failed to invalidate token cache:', error);
    }
  }

  // Invalidate all user tokens (for logout)
  async invalidateAllUserTokens(userId: string): Promise<void> {
    try {
      // Invalidate user data cache
      await this.invalidateUserCache(userId);
      this.logger.debug(`Invalidated all caches for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to invalidate all caches for user ${userId}:`,
        error,
      );
    }
  }
}

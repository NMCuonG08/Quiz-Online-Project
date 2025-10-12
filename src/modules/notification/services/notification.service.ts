import { Notification } from '@prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationStatus,
} from '../dtos/notification.dto';
import { OnEvent } from '@/common/decorators';
import { ArgOf } from '@/common/repositories/event.repository';

@Injectable()
export class NotificationService extends BaseService {
  async createNotification(createNotificationDto: CreateNotificationDto) {
    const newNotification = await this.notificationRepository.create(
      createNotificationDto,
    );

    // Invalidate cache when creating new notification
    if (createNotificationDto.user_id) {
      await this.redisService.del(
        `notifications:user:${createNotificationDto.user_id}`,
      );
      await this.redisService.del(
        `notifications:unread:${createNotificationDto.user_id}`,
      );
    }

    return newNotification;
  }

  async findAllNotifications() {
    const cacheKey = 'notifications:all';

    // Try to get from cache first
    const cachedNotifications = await this.redisService.get(cacheKey);
    if (cachedNotifications) {
      return cachedNotifications;
    }

    // If not in cache, query from database
    const notifications = await this.notificationRepository.findMany({
      orderBy: { created_at: 'desc' },
    });

    // Cache result with TTL 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, notifications, 300);

    return notifications;
  }

  async findNotificationById(id: string) {
    const notification = await this.notificationRepository.findUnique({ id });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    return notification;
  }

  async findNotificationsByUserId(userId: string) {
    const cacheKey = `notifications:user:${userId}`;

    // Try to get from cache first
    const cachedNotifications = await this.redisService.get(cacheKey);
    if (cachedNotifications) {
      return cachedNotifications;
    }

    // If not in cache, query from database
    const notifications =
      await this.notificationRepository.findByUserId(userId);

    // Cache result with TTL 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, notifications, 300);

    return notifications;
  }

  async findNotificationsByStatus(status: NotificationStatus) {
    const cacheKey = `notifications:status:${status}`;

    // Try to get from cache first
    const cachedNotifications = await this.redisService.get(cacheKey);
    if (cachedNotifications) {
      return cachedNotifications;
    }

    // If not in cache, query from database
    const notifications =
      await this.notificationRepository.findByStatus(status);

    // Cache result with TTL 5 minutes (300 seconds)
    await this.redisService.set(cacheKey, notifications, 300);

    return notifications;
  }

  async updateNotification(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ) {
    const existingNotification = await this.notificationRepository.findUnique({
      id,
    });
    if (!existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    const updatedNotification = await this.notificationRepository.update(
      id,
      updateNotificationDto,
    );

    // Invalidate related caches
    await this.redisService.del('notifications:all');
    if (existingNotification.user_id) {
      await this.redisService.del(
        `notifications:user:${existingNotification.user_id}`,
      );
      await this.redisService.del(
        `notifications:unread:${existingNotification.user_id}`,
      );
    }
    if (updateNotificationDto.status) {
      await this.redisService.del(
        `notifications:status:${updateNotificationDto.status}`,
      );
    }

    return updatedNotification;
  }

  async deleteNotification(id: string) {
    const existingNotification = await this.notificationRepository.findUnique({
      id,
    });
    if (!existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.delete(id);

    // Invalidate related caches
    await this.redisService.del('notifications:all');
    if (existingNotification.user_id) {
      await this.redisService.del(
        `notifications:user:${existingNotification.user_id}`,
      );
      await this.redisService.del(
        `notifications:unread:${existingNotification.user_id}`,
      );
    }

    return { message: 'Notification deleted successfully' };
  }

  async markAsRead(id: string) {
    const existingNotification = await this.notificationRepository.findUnique({
      id,
    });
    if (!existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    const updatedNotification =
      await this.notificationRepository.markAsRead(id);

    // Invalidate related caches
    await this.redisService.del('notifications:all');
    if (existingNotification.user_id) {
      await this.redisService.del(
        `notifications:user:${existingNotification.user_id}`,
      );
      await this.redisService.del(
        `notifications:unread:${existingNotification.user_id}`,
      );
    }

    return updatedNotification;
  }

  async markAsArchived(id: string) {
    const existingNotification = await this.notificationRepository.findUnique({
      id,
    });
    if (!existingNotification) {
      throw new NotFoundException('Notification not found');
    }

    const updatedNotification =
      await this.notificationRepository.markAsArchived(id);

    // Invalidate related caches
    await this.redisService.del('notifications:all');
    if (existingNotification.user_id) {
      await this.redisService.del(
        `notifications:user:${existingNotification.user_id}`,
      );
      await this.redisService.del(
        `notifications:unread:${existingNotification.user_id}`,
      );
    }

    return updatedNotification;
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationRepository.markAllAsRead(userId);

    // Invalidate related caches
    await this.redisService.del(`notifications:user:${userId}`);
    await this.redisService.del(`notifications:unread:${userId}`);

    return {
      message: 'All notifications marked as read',
      count: result.count,
    };
  }

  async getUnreadCount(userId: string) {
    const cacheKey = `notifications:unread:${userId}`;

    // Try to get from cache first
    const cachedCount = await this.redisService.get(cacheKey);
    if (cachedCount !== null) {
      return { count: cachedCount };
    }

    // If not in cache, query from database
    const count = await this.notificationRepository.getUnreadCount(userId);

    // Cache result with TTL 1 minute (60 seconds)
    await this.redisService.set(cacheKey, count, 60);

    return { count };
  }

  @OnEvent({ name: 'UserLogin' })
  handleUserLogin(payload: ArgOf<'UserLogin'>) {
    this.eventRepository.clientSend(
      'on_user_delete',
      payload.userId,
      payload.userId,
    );
  }

  @OnEvent({ name: 'Notification' })
  notificationForUser({ userId, message }: ArgOf<'Notification'>) {
    console.log('🎯 NotificationService.notificationForUser called!');
    console.log('Sending notification to user:', userId, message);
    // this.eventRepository.clientSend('notification', userId, message);
    this.eventRepository.clientBroadcast('notification', message);
  }
}

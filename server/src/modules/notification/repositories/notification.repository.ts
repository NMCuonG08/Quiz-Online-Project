import { Injectable } from '@nestjs/common';
import { Notification } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { NotificationStatus } from '../dtos/notification.dto';

@Injectable()
export class NotificationRepository extends BaseRepository<Notification> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.notification;
  }

  async findByUserId(userId: string) {
    return this.model.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByUserIdPaginated(userId: string, skip: number, take: number) {
    return this.model.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip,
      take,
    });
  }

  async countByUserId(userId: string) {
    return this.model.count({
      where: { user_id: userId },
    });
  }

  async findByStatus(status: NotificationStatus) {
    const isRead =
      status === NotificationStatus.READ
        ? true
        : status === NotificationStatus.UNREAD
          ? false
          : undefined;

    return this.model.findMany({
      where: {
        ...(isRead !== undefined ? { is_read: isRead } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByUserIdAndStatus(userId: string, status: NotificationStatus) {
    const isRead =
      status === NotificationStatus.READ
        ? true
        : status === NotificationStatus.UNREAD
          ? false
          : undefined;

    return this.model.findMany({
      where: {
        user_id: userId,
        ...(isRead !== undefined ? { is_read: isRead } : {}),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.model.update({
      where: { id },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async markAsArchived(id: string) {
    // Archive not modeled separately in DB; treat as read
    return this.model.update({
      where: { id },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.model.updateMany({
      where: {
        user_id: userId,
        is_read: false,
      },
      data: { is_read: true, read_at: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    return this.model.count({
      where: {
        user_id: userId,
        is_read: false,
      },
    });
  }
}

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

  async findByStatus(status: NotificationStatus) {
    return this.model.findMany({
      where: { status },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByUserIdAndStatus(userId: string, status: NotificationStatus) {
    return this.model.findMany({
      where: {
        user_id: userId,
        status,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async markAsRead(id: string) {
    return this.model.update({
      where: { id },
      data: { status: NotificationStatus.READ },
    });
  }

  async markAsArchived(id: string) {
    return this.model.update({
      where: { id },
      data: { status: NotificationStatus.ARCHIVED },
    });
  }

  async markAllAsRead(userId: string) {
    return this.model.updateMany({
      where: {
        user_id: userId,
        status: NotificationStatus.UNREAD,
      },
      data: { status: NotificationStatus.READ },
    });
  }

  async getUnreadCount(userId: string) {
    return this.model.count({
      where: {
        user_id: userId,
        status: NotificationStatus.UNREAD,
      },
    });
  }
}

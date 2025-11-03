import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import {
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationStatus,
} from '../dtos/notification.dto';
import { Authenticated } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
import { AuthGuard } from '@/common/guards/auth.guard';
import { UuidPipe } from '@/common/pipes/uuid.pipe';

@Controller('/api/notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityCreate })
  createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.createNotification(createNotificationDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  findAllNotifications() {
    return this.notificationService.findAllNotifications();
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  findNotificationsByUserId(@Param('userId', UuidPipe) userId: string) {
    return this.notificationService.findNotificationsByUserId(userId);
  }

  @Get('status/:status')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  findNotificationsByStatus(@Param('status') status: NotificationStatus) {
    return this.notificationService.findNotificationsByStatus(status);
  }

  @Get('unread-count/:userId')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  getUnreadCount(@Param('userId', UuidPipe) userId: string) {
    return this.notificationService.getUnreadCount(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  findNotificationById(@Param('id', UuidPipe) id: string) {
    return this.notificationService.findNotificationById(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityUpdate })
  updateNotification(
    @Param('id', UuidPipe) id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationService.updateNotification(
      id,
      updateNotificationDto,
    );
  }

  @Put(':id/mark-read')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityUpdate })
  markAsRead(@Param('id', UuidPipe) id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Put(':id/mark-archived')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityUpdate })
  markAsArchived(@Param('id', UuidPipe) id: string) {
    return this.notificationService.markAsArchived(id);
  }

  @Put('user/:userId/mark-all-read')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityUpdate })
  markAllAsRead(@Param('userId', UuidPipe) userId: string) {
    return this.notificationService.markAllAsRead(userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityDelete })
  deleteNotification(@Param('id', UuidPipe) id: string) {
    return this.notificationService.deleteNotification(id);
  }
}

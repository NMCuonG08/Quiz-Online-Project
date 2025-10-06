import { Module } from '@nestjs/common';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';
import { BaseModule } from '@/common/base/base.module';
import { BaseRepository } from '@/common/base/base.repository';
import { NotificationRepository } from './repositories/notification.repository';

@Module({
  imports: [BaseModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    { provide: BaseRepository, useExisting: NotificationRepository },
  ],
  exports: [NotificationService],
})
export class NotificationModule {}

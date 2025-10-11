import { Module } from '@nestjs/common';
import { WebSocketSetupService } from './websocket-setup.service';
import { EventRepository } from '@/common/repositories/event.repository';
import { AuthModule } from '@/modules/auth/auth.module';
import { CommonRepositoriesModule } from '@/common/repositories/common-repositories.module';
import { NotificationModule } from '@/modules/notification/notification.module';

@Module({
  imports: [CommonRepositoriesModule, AuthModule, NotificationModule],
  providers: [
    WebSocketSetupService,
    {
      provide: 'EVENT_REPOSITORY',
      useExisting: EventRepository,
    },
    EventRepository,
  ],
  exports: ['EVENT_REPOSITORY'],
})
export class WebSocketModule {}

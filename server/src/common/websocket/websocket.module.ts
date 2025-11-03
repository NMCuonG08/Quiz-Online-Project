import { Module } from '@nestjs/common';
import { WebSocketSetupService } from './websocket-setup.service';
import { EventRepository } from '@/common/repositories/event.repository';
import { AuthModule } from '@/modules/auth/auth.module';
import { CommonRepositoriesModule } from '@/common/repositories/common-repositories.module';
import { NotificationModule } from '@/modules/notification/notification.module';
import { CategoryModule } from '@/modules/category/category.module';
import { BaseModule } from '@/common/base/base.module';

@Module({
  imports: [
    CommonRepositoriesModule,
    AuthModule,
    NotificationModule,
    CategoryModule,
    BaseModule,
  ],
  providers: [WebSocketSetupService],
  exports: [],
})
export class WebSocketModule {}

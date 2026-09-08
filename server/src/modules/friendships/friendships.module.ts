import { Module } from '@nestjs/common';
import { FriendshipController } from './controllers/friendship.controller';
import { FriendshipService } from './services/friendship.service';

import { GuardsModule } from '@/common/guards/guards.module';
import { AiIdempotencyInterceptor } from '@/common/interceptors/ai-idempotency.interceptor';
import { PrismaModule } from '@/infrastructure/database/prisma.module';

@Module({
  imports: [GuardsModule, PrismaModule],
  controllers: [FriendshipController],
  providers: [FriendshipService, AiIdempotencyInterceptor],
  exports: [FriendshipService],
})
export class FriendshipModule {}

import { Module } from '@nestjs/common';
import { FriendshipController } from './controllers/friendship.controller';
import { FriendshipService } from './services/friendship.service';

import { GuardsModule } from '@/common/guards/guards.module';

@Module({
  imports: [GuardsModule],
  controllers: [FriendshipController],
  providers: [FriendshipService],
  exports: [FriendshipService],
})
export class FriendshipModule {}

import { Module } from '@nestjs/common';
import { GuardsModule } from '@/common/guards/guards.module';
import { AiChatHistoryController } from './ai-chat-history.controller';
import { AiChatHistoryService } from './ai-chat-history.service';

@Module({
  imports: [GuardsModule],
  controllers: [AiChatHistoryController],
  providers: [AiChatHistoryService],
})
export class AiChatHistoryModule {}

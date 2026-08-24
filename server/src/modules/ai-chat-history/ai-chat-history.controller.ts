import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Auth, Authenticated, AuthGuard } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';
import { AiChatHistoryService } from './ai-chat-history.service';
import type { HistoryMessage } from './ai-chat-history.service';

@Controller('/api/ai-chat/conversations')
@UseGuards(AuthGuard)
export class AiChatHistoryController {
  constructor(private readonly history: AiChatHistoryService) {}

  @Get()
  @Authenticated({ permission: false })
  list(@Auth() auth: AuthDto) { return this.history.list(auth.user.id); }

  @Get(':sessionId')
  @Authenticated({ permission: false })
  get(@Param('sessionId') sessionId: string, @Auth() auth: AuthDto) { return this.history.get(auth.user.id, sessionId); }

  @Post(':sessionId/messages')
  @Authenticated({ permission: false })
  append(@Param('sessionId') sessionId: string, @Body() body: { scope?: string; messages?: HistoryMessage[] }, @Auth() auth: AuthDto) { return this.history.append(auth.user.id, sessionId, body.scope || 'learner', body.messages || []); }

  @Delete(':sessionId')
  @Authenticated({ permission: false })
  remove(@Param('sessionId') sessionId: string, @Auth() auth: AuthDto) { return this.history.remove(auth.user.id, sessionId); }
}

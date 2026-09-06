import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Auth, AuthGuard, Authenticated } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';
import { CreateConversationDto, SendMessageDto } from '../dtos/messaging.dto';
import { MessagingService } from '../services/messaging.service';

@Controller('/api/conversations')
@UseGuards(AuthGuard)
export class MessagingController {
  constructor(private readonly messaging: MessagingService) {}
  @Post()
  @Authenticated({ permission: false })
  create(@Auth() auth: AuthDto, @Body() dto: CreateConversationDto) { return this.messaging.createDirect(auth.user.id, dto); }
  @Get()
  @Authenticated({ permission: false })
  list(@Auth() auth: AuthDto) { return this.messaging.listConversations(auth.user.id); }
  @Get(':id/messages')
  @Authenticated({ permission: false })
  messages(@Auth() auth: AuthDto, @Param('id') id: string, @Query('cursor') cursor?: string) { return this.messaging.listMessages(auth.user.id, id, cursor); }
  @Post(':id/messages')
  @Authenticated({ permission: false })
  send(@Auth() auth: AuthDto, @Param('id') id: string, @Body() dto: SendMessageDto) { return this.messaging.sendMessage(auth.user.id, id, dto); }
  @Patch(':id/read')
  @Authenticated({ permission: false })
  read(@Auth() auth: AuthDto, @Param('id') id: string) { return this.messaging.markRead(auth.user.id, id); }
}

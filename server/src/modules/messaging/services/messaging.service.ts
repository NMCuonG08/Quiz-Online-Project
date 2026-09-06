import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { EventRepository } from '@/common/repositories/event.repository';
import { CreateConversationDto, SendMessageDto } from '../dtos/messaging.dto';

@Injectable()
export class MessagingService {
  constructor(private readonly prisma: PrismaService, private readonly events: EventRepository) {}

  private async assertFriend(userId: string, otherUserId: string) {
    const friendship = await this.prisma.friendship.findFirst({ where: { status: 'ACCEPTED', OR: [{ userId, friendId: otherUserId }, { userId: otherUserId, friendId: userId }] } });
    if (!friendship) throw new ForbiddenException('You can only message friends');
  }

  private async assertMember(userId: string, conversationId: string) {
    const member = await this.prisma.conversationMember.findUnique({ where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } } });
    if (!member) throw new ForbiddenException('You are not a member of this conversation');
    return member;
  }

  async createDirect(userId: string, dto: CreateConversationDto) {
    if (userId === dto.otherUserId) throw new ForbiddenException('You cannot message yourself');
    await this.assertFriend(userId, dto.otherUserId);
    const existing = await this.prisma.conversation.findMany({ where: { type: 'DIRECT', members: { some: { user_id: userId } } }, include: { members: true } });
    const match = existing.find((conversation) => conversation.members.length === 2 && conversation.members.some((member) => member.user_id === dto.otherUserId));
    if (match) return match;
    return this.prisma.conversation.create({ data: { type: 'DIRECT', members: { create: [{ user_id: userId }, { user_id: dto.otherUserId }] } }, include: { members: true } });
  }

  async listConversations(userId: string) {
    return this.prisma.conversation.findMany({ where: { members: { some: { user_id: userId } } }, orderBy: { updated_at: 'desc' }, include: { members: { include: { user: { select: { id: true, username: true, full_name: true, avatar: true } } } }, messages: { orderBy: { created_at: 'desc' }, take: 1, include: { sender: { select: { id: true, username: true, full_name: true, avatar: true } } } } } });
  }

  async listMessages(userId: string, conversationId: string, cursor?: string) {
    await this.assertMember(userId, conversationId);
    return this.prisma.message.findMany({ where: { conversation_id: conversationId }, orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: 50, ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}), include: { sender: { select: { id: true, username: true, full_name: true, avatar: true } } } });
  }

  async sendMessage(userId: string, conversationId: string, dto: SendMessageDto) {
    await this.assertMember(userId, conversationId);
    const clientMessageId = dto.clientMessageId || randomUUID();
    const existing = await this.prisma.message.findUnique({ where: { sender_id_client_message_id: { sender_id: userId, client_message_id: clientMessageId } }, include: { sender: { select: { id: true, username: true, full_name: true, avatar: true } } } });
    if (existing) return existing;
    const message = await this.prisma.message.create({ data: { conversation_id: conversationId, sender_id: userId, client_message_id: clientMessageId, body: dto.body.trim(), type: dto.type || 'TEXT' }, include: { sender: { select: { id: true, username: true, full_name: true, avatar: true } } } });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { updated_at: new Date() } });
    const members = await this.prisma.conversationMember.findMany({ where: { conversation_id: conversationId }, select: { user_id: true } });
    await Promise.all(members.map((member) => member.user_id === userId ? Promise.resolve() : Promise.resolve(this.events.clientSend('direct_message', member.user_id, { conversationId, message }))));
    return message;
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertMember(userId, conversationId);
    return this.prisma.conversationMember.update({ where: { conversation_id_user_id: { conversation_id: conversationId, user_id: userId } }, data: { last_read_at: new Date() } });
  }
}

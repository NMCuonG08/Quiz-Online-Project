import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';

export type HistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
  metadata?: unknown;
};

const ALLOWED_METADATA_KEYS = new Set([
  'agent',
  'tool',
  'surface',
  'citations',
  'trace_id',
  'trace_steps',
  'error',
  'approval_expires_at',
  'resolved_approval_token',
  'approval_succeeded',
]);

@Injectable()
export class AiChatHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async append(
    userId: string,
    sessionId: string,
    scope: string,
    messages: HistoryMessage[],
  ) {
    const safe = messages
      .filter(
        (message) =>
          ['user', 'assistant'].includes(message.role) &&
          typeof message.content === 'string' &&
          message.content.trim(),
      )
      .map((message) => ({
        role: message.role,
        content: message.content.slice(0, 8000),
        metadata: this.sanitizeMetadata(message.metadata),
      }));
    if (!safe.length) return null;
    const batchStartedAt = Date.now();
    const conversation = await this.prisma.aiChatConversation.upsert({
      where: { user_id_session_id: { user_id: userId, session_id: sessionId } },
      create: {
        user_id: userId,
        session_id: sessionId,
        scope,
        title:
          safe.find((item) => item.role === 'user')?.content.slice(0, 160) ||
          'Cuộc trò chuyện mới',
      },
      update: { scope, updated_at: new Date() },
    });
    await this.prisma.aiChatMessage.createMany({
      data: safe.map((message, index) => ({
        ...message,
        conversation_id: conversation.id,
        // Keep user → assistant order deterministic even when both messages
        // are persisted within the same database timestamp tick.
        created_at: new Date(batchStartedAt + index),
      })),
    });
    return { id: conversation.id, session_id: sessionId };
  }

  async list(userId: string) {
    return this.prisma.aiChatConversation.findMany({
      where: { user_id: userId },
      orderBy: { updated_at: 'desc' },
      take: 50,
      select: { session_id: true, title: true, scope: true, updated_at: true },
    });
  }

  async get(userId: string, sessionId: string) {
    const conversation = await this.prisma.aiChatConversation.findUnique({
      where: { user_id_session_id: { user_id: userId, session_id: sessionId } },
      include: { messages: { orderBy: { created_at: 'asc' } } },
    });
    if (!conversation)
      throw new NotFoundException('Chat conversation not found');
    // Legacy rows may share the same timestamp. Keep their display order
    // stable and prefer the natural user → assistant pair order on ties.
    conversation.messages.sort((left, right) => {
      const timeDiff = left.created_at.getTime() - right.created_at.getTime();
      if (timeDiff !== 0) return timeDiff;
      if (left.role !== right.role) return left.role === 'user' ? -1 : 1;
      return left.id.localeCompare(right.id);
    });
    return conversation;
  }

  async remove(userId: string, sessionId: string) {
    await this.prisma.aiChatConversation.delete({
      where: { user_id_session_id: { user_id: userId, session_id: sessionId } },
    });
    return { deleted: true };
  }

  private sanitizeMetadata(value: unknown): Prisma.InputJsonObject {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const source = value as Record<string, unknown>;
    const filtered = Object.fromEntries(
      Object.entries(source).filter(
        ([key, item]) => ALLOWED_METADATA_KEYS.has(key) && item !== undefined,
      ),
    );
    try {
      const serialized = JSON.stringify(filtered);
      if (serialized.length > 64_000) return {};
      return JSON.parse(serialized) as Prisma.InputJsonObject;
    } catch {
      return {};
    }
  }
}

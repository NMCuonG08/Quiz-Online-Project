import { AiChatHistoryService } from './ai-chat-history.service';

describe('AiChatHistoryService', () => {
  it('persists safe render metadata with each message', async () => {
    const prisma = {
      aiChatConversation: {
        upsert: jest.fn().mockResolvedValue({ id: 'conversation-1' }),
      },
      aiChatMessage: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = new AiChatHistoryService(prisma as never);

    await service.append('user-1', 'session-1', 'creator', [{
      role: 'assistant',
      content: 'Đề xuất đã sẵn sàng.',
      metadata: {
        tool: 'create_quiz',
        surface: { title: 'Xác nhận tạo quiz', blocks: [], actions: [] },
        citations: [],
        untrusted_key: 'drop-me',
      },
    }]);

    const data = prisma.aiChatMessage.createMany.mock.calls[0][0].data[0];
    expect(data.metadata.tool).toBe('create_quiz');
    expect(data.metadata.surface.title).toBe('Xác nhận tạo quiz');
    expect(data.metadata.untrusted_key).toBeUndefined();
  });

  it('drops oversized metadata without dropping the message', async () => {
    const prisma = {
      aiChatConversation: {
        upsert: jest.fn().mockResolvedValue({ id: 'conversation-1' }),
      },
      aiChatMessage: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const service = new AiChatHistoryService(prisma as never);

    await service.append('user-1', 'session-1', 'creator', [{
      role: 'assistant', content: 'Kết quả', metadata: { surface: { content: 'x'.repeat(70_000) } },
    }]);

    const data = prisma.aiChatMessage.createMany.mock.calls[0][0].data[0];
    expect(data.metadata).toEqual({});
    expect(data.content).toBe('Kết quả');
  });
});

import { RoomService } from './room.service';
import { ForbiddenException } from '@nestjs/common';

describe('RoomService realtime presence', () => {
  const roomId = '11111111-1111-4111-8111-111111111111';
  const userId = '22222222-2222-4222-8222-222222222222';

  function createService(
    roomStatus: 'OPEN' | 'IN_GAME' | 'CLOSED' = 'OPEN',
    initialStatus: 'JOINED' | 'ACTIVE' | 'DISCONNECTED' | null = null,
  ) {
    let status = initialStatus;
    let currentParticipants = 0;
    const room = {
      id: roomId,
      room_code: 'ABC123',
      max_participants: 10,
      current_participants: 0,
      is_private: false,
      status: roomStatus,
    };
    const tx = {
      quizRoom: {
        findUnique: jest.fn(async () => ({
          ...room,
          current_participants: currentParticipants,
        })),
        update: jest.fn(async ({ data }: any) => {
          currentParticipants = Number(data.current_participants);
          return { ...room, current_participants: currentParticipants };
        }),
      },
      roomParticipant: {
        findUnique: jest.fn(async () =>
          status ? { id: 'participant-1', status } : null,
        ),
        count: jest.fn(async () =>
          status && ['JOINED', 'ACTIVE'].includes(status) ? 1 : 0,
        ),
        upsert: jest.fn(async ({ create, update }: any) => {
          status = initialStatus ? update.status : create.status;
          return { id: 'participant-1', status };
        }),
        update: jest.fn(async ({ data }: any) => {
          status = data.status;
          return { id: 'participant-1', status };
        }),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };
    const service = Object.create(RoomService.prototype) as RoomService;
    Object.assign(service as any, {
      prisma,
      roomRepository: {
        findUnique: jest.fn(async () => ({
          ...room,
          current_participants: currentParticipants,
        })),
      },
      eventRepository: { joinUserToRoom: jest.fn(), emit: jest.fn() },
    });
    return {
      service,
      getCount: () => currentParticipants,
      getStatus: () => status,
    };
  }

  it('does not increment participant count on duplicate join/reconnect', async () => {
    const fixture = createService();
    await fixture.service.joinRoomViaWebSocket(userId, roomId);
    await fixture.service.joinRoomViaWebSocket(userId, roomId);
    expect(fixture.getCount()).toBe(1);
    expect(fixture.getStatus()).toBe('JOINED');
  });

  it('does not decrement participant count on duplicate leave/disconnect', async () => {
    const fixture = createService();
    await fixture.service.joinRoomViaWebSocket(userId, roomId);
    await fixture.service.leaveRoomViaWebSocket(userId, roomId);
    await fixture.service.leaveRoomViaWebSocket(userId, roomId);
    expect(fixture.getCount()).toBe(0);
    expect(fixture.getStatus()).toBe('DISCONNECTED');
  });

  it('allows an existing disconnected player to resume an active game', async () => {
    const fixture = createService('IN_GAME', 'DISCONNECTED');
    await fixture.service.joinRoomViaWebSocket(userId, roomId);
    expect(fixture.getStatus()).toBe('ACTIVE');
    expect(fixture.getCount()).toBe(1);
  });

  it('rejects brand-new players after the game starts', async () => {
    const fixture = createService('IN_GAME');
    await expect(
      fixture.service.joinRoomViaWebSocket(userId, roomId),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});

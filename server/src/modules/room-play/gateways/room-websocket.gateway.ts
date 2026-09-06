import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { EventRepository } from '@/common/repositories/event.repository';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';
import { RedisService } from '@/infrastructure/cache/redis/redis.service';
import { AuthService } from '@/modules/auth/services/auth.service';

interface AuthenticatedSocket extends Socket {
  user?: AuthDto;
}

interface RoomScoreEntry {
  userId: string;
  username: string;
  score: number;
  correctAnswers: number;
  timestamp: string;
  totalTimeMs?: number;
}

interface RoomGameState {
  roomId: string;
  status: 'WAITING' | 'QUESTION' | 'REVEAL' | 'FINISHED';
  questionIndex: number;
  questionId?: string;
  deadline?: number;
  questionStartedAt?: number;
  revealEndsAt?: number;
  answeredCount?: number;
  rosterCount?: number;
  questionResults?: RoomQuestionResult[];
  version: number;
  serverTime: number;
}

interface RoomQuestionResult {
  userId: string;
  username: string;
  isCorrect: boolean;
  points: number;
  responseTimeMs: number | null;
  answeredAt?: string;
}

interface StoredRoomAnswer {
  questionId: string;
  commandId: string;
  isCorrect: boolean;
  correctAnswer: string;
  points: number;
  responseTimeMs: number;
  answeredAt: string;
  selectedOptionIds?: string[];
  textAnswer?: string;
}

@Injectable()
@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
export class RoomWebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomWebSocketGateway.name);
  // Track rooms per socket manually to ensure disconnect cleanup still knows memberships
  private socketRooms: Map<string, Set<string>> = new Map();
  // In-memory chat storage per room (ephemeral)
  private roomMessages: Map<
    string,
    Array<{
      id: string;
      room_id: string;
      user_id: string;
      username: string;
      message: string;
      message_type: 'text' | 'system' | 'notification';
      created_at: string;
    }>
  > = new Map();
  // In-memory score storage per room (ephemeral)
  private roomScores: Map<string, Map<string, RoomScoreEntry>> = new Map();
  private readonly disconnectGraceMs = 30000;
  private readonly disconnectTimers = new Map<string, NodeJS.Timeout>();
  private readonly gameTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly roomService: RoomService,
    private readonly eventRepository: EventRepository,
    private readonly redisService: RedisService,
    private readonly authService: AuthService,
  ) {}

  afterInit(server: Server) {
    server.use((socket: AuthenticatedSocket, next) => {
      void this.authenticateClient(socket)
        .then(() => next())
        .catch((error) => {
          this.logger.warn(
            `Room socket authentication rejected: ${error instanceof Error ? error.message : String(error)}`,
          );
          next(new Error('Unauthorized'));
        });
    });
  }

  private async authenticateClient(client: AuthenticatedSocket): Promise<void> {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');
    const authDto = await this.authService.authenticate({
      headers: {
        authorization: `Bearer ${token}`,
        cookie: client.handshake.headers.cookie || '',
      },
      queryParams: {},
      metadata: {
        sharedLinkRoute: false,
        adminRoute: false,
        permission: false,
        uri: '/websocket/room',
      },
    });
    client.user = authDto;
    client.data.userId = authDto.user.id;
    (client as any).token = token;
  }

  private async enforceSocketRateLimit(
    client: AuthenticatedSocket,
    event: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    try {
      const userId = this.extractUserIdFromToken(client);
      const identity =
        userId && userId !== 'temp-user-id' ? userId : `socket:${client.id}`;
      const key = `ratelimit:ws:${event}:${identity}`;
      const countRaw: number = await this.redisService.incrementWithTtl(
        key,
        windowSeconds,
      );
      const count = Number(countRaw);

      if (count > limit) {
        client.emit('rate_limit_exceeded', {
          event,
          limit,
          windowSeconds,
          message: `Too many ${event} requests. Please try again later.`,
        });
        this.logger.warn(
          `🚫 WebSocket rate limit exceeded for ${identity} on ${event}: ${count}/${limit} in ${windowSeconds}s`,
        );
        return true;
      }
    } catch (error) {
      // Fail-open to avoid blocking user flow when Redis has transient issues.
      this.logger.warn(
        `⚠️ Failed to evaluate socket rate limit for ${event}:`,
        error,
      );
    }

    return false;
  }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`🔌 Room WebSocket connected: ${client.id}`);
    this.logger.log(`✅ Room socket authenticated: ${client.id}`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`🔌 Room WebSocket disconnected: ${client.id}`);

    try {
      // Extract user ID from token
      const userId = this.extractUserIdFromToken(client);

      if (!userId || userId === 'temp-user-id') {
        this.logger.warn(
          `⚠️ Cannot extract user ID for disconnected client ${client.id}, skipping room cleanup`,
        );
        return;
      }

      // Find all rooms that this client was in (format: "room:${roomId}")
      const roomPrefix = 'room:';
      const joinedRooms = Array.from(
        this.socketRooms.get(client.id) ?? new Set<string>(),
      ).filter((room) => room.startsWith(roomPrefix));

      this.logger.log(
        `🔄 Client ${client.id} (user ${userId}) was in ${joinedRooms.length} room(s):`,
        joinedRooms,
      );

      // Delay DB leave so short network drops/reconnects do not flap presence.
      for (const socketRoom of joinedRooms) {
        const roomId = socketRoom.replace(roomPrefix, '');
        if (roomId) this.scheduleDisconnectCleanup(userId, roomId);
      }

      this.logger.log(
        `✅ Completed disconnect cleanup for client ${client.id}`,
      );
      // Cleanup tracking map for this socket
      this.socketRooms.delete(client.id);
    } catch (error) {
      this.logger.error(
        `❌ Error handling disconnect for client ${client.id}:`,
        error,
      );
    }
  }

  private extractUserIdFromToken(client: AuthenticatedSocket): string {
    const authenticatedUserId = client.user?.user?.id || client.data?.userId;
    if (!authenticatedUserId) throw new Error('Socket is not authenticated');
    return String(authenticatedUserId);
  }

  private disconnectKey(userId: string, roomId: string): string {
    return `${userId}:${roomId}`;
  }

  private cancelDisconnectCleanup(userId: string, roomId: string): void {
    const key = this.disconnectKey(userId, roomId);
    const timer = this.disconnectTimers.get(key);
    if (timer) clearTimeout(timer);
    this.disconnectTimers.delete(key);
  }

  private scheduleDisconnectCleanup(userId: string, roomId: string): void {
    this.cancelDisconnectCleanup(userId, roomId);
    const key = this.disconnectKey(userId, roomId);
    const timer = setTimeout(() => {
      void this.finalizeDisconnect(userId, roomId)
        .catch((error) => {
          this.logger.warn(
            `Disconnect cleanup skipped for room ${roomId}: ${error instanceof Error ? error.message : String(error)}`,
          );
        })
        .finally(() => {
          this.disconnectTimers.delete(key);
        });
    }, this.disconnectGraceMs);
    this.disconnectTimers.set(key, timer);
  }

  private async finalizeDisconnect(
    userId: string,
    roomId: string,
  ): Promise<void> {
    const socketRoom = `room:${roomId}`;
    const sockets = await this.server.in(socketRoom).fetchSockets();
    if (
      sockets.some((socket) => String(socket.data?.userId || '') === userId)
    ) {
      return;
    }
    await this.roomService.leaveRoomViaWebSocket(userId, roomId);
    this.server
      .to(socketRoom)
      .emit('user_left', { userId, roomId, message: 'User left the room' });
    await this.broadcastParticipants(roomId);
  }

  private async broadcastParticipants(roomId: string): Promise<void> {
    const participants = await this.roomService.getParticipants(roomId);
    const revision = await this.nextRoomRevision(roomId);
    this.server.to(`room:${roomId}`).emit('participants_list', {
      roomId,
      participants: participants.participants,
      revision,
    });
  }

  private async nextRoomRevision(roomId: string): Promise<number> {
    try {
      return await this.redisService.incrementWithTtl(
        `room:${roomId}:revision`,
        86400,
      );
    } catch {
      return Date.now();
    }
  }

  private async currentRoomRevision(roomId: string): Promise<number> {
    try {
      return (
        Number(
          await this.redisService.get<number>(`room:${roomId}:revision`),
        ) || 0
      );
    } catch {
      return Date.now();
    }
  }

  private async getGameState(roomId: string): Promise<RoomGameState | null> {
    try {
      return await this.redisService.get<RoomGameState>(`room:${roomId}:game`);
    } catch {
      const room = await this.roomService.getRoom(roomId);
      const settings = room.settings && typeof room.settings === 'object' && !Array.isArray(room.settings)
        ? room.settings as Record<string, unknown>
        : {};
      return (settings.gameSnapshot as RoomGameState | undefined) || null;
    }
  }

  private async getRoster(roomId: string): Promise<Array<{ userId: string; username: string }>> {
    if (typeof (this.roomService as any).getGameRoster === 'function') {
      return (this.roomService as any).getGameRoster(roomId);
    }
    const participants = await this.roomService.getParticipants(roomId);
    return participants.participants
      .filter((participant) => ['JOINED', 'ACTIVE', 'DISCONNECTED', 'FINISHED'].includes(participant.status))
      .map((participant) => ({
        userId: participant.user_id,
        username: participant.full_name || participant.username || participant.user_id.slice(0, 8),
      }));
  }

  private async getQuestionResults(roomId: string, questionId: string): Promise<RoomQuestionResult[]> {
    const roster = await this.getRoster(roomId);
    let persisted: Record<string, unknown>[] = [];
    if (typeof (this.roomService as any).getPersistedRealtimeAnswers === 'function') {
      try {
        persisted = await (this.roomService as any).getPersistedRealtimeAnswers(roomId, questionId);
      } catch (error) {
        this.logger.warn(`Unable to load durable answers for room ${roomId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    const persistedByUser = new Map(persisted.map((answer: Record<string, unknown>) => [String(answer.userId), answer]));
    const results = await Promise.all(roster.map(async (player) => {
      let answer: StoredRoomAnswer | null = null;
      try {
        answer = await this.redisService.get<StoredRoomAnswer>(
          `room:${roomId}:answered:${player.userId}:${questionId}`,
        );
      } catch {
        answer = null;
      }
      const durable = persistedByUser.get(player.userId) as Record<string, unknown> | undefined;
      return {
        userId: player.userId,
        username: player.username,
        isCorrect: Boolean(answer?.isCorrect ?? durable?.isCorrect),
        points: Number(answer?.points ?? durable?.points ?? 0),
        responseTimeMs: answer ? Number(answer.responseTimeMs || 0) : durable ? Number(durable.responseTimeMs || 0) : null,
        answeredAt: answer?.answeredAt || String(durable?.answeredAt || ''),
      };
    }));
    return results.sort((a, b) => {
      if (a.responseTimeMs === null) return 1;
      if (b.responseTimeMs === null) return -1;
      return a.responseTimeMs - b.responseTimeMs || b.points - a.points || a.userId.localeCompare(b.userId);
    });
  }

  private sortLeaderboard(entries: RoomScoreEntry[]): RoomScoreEntry[] {
    return [...entries].sort((a, b) =>
      Number(b.score || 0) - Number(a.score || 0)
      || Number(b.correctAnswers || 0) - Number(a.correctAnswers || 0)
      || Number(a.totalTimeMs || 0) - Number(b.totalTimeMs || 0)
      || a.userId.localeCompare(b.userId),
    );
  }

  private async setGameState(state: RoomGameState): Promise<void> {
    try {
      await this.redisService.set(`room:${state.roomId}:game`, state, 21600);
    } catch {
      this.logger.warn(`Redis game snapshot unavailable for room ${state.roomId}; using durable snapshot`);
    }
    await this.roomService.persistGameSnapshot(
      state.roomId,
      state as unknown as Record<string, unknown>,
    );
  }

  private async nextGameRevision(roomId: string): Promise<number> {
    try {
      return await this.redisService.incrementWithTtl(`room:${roomId}:game:revision`, 21600);
    } catch {
      const current = await this.getGameState(roomId);
      return Number(current?.version || 0) + 1;
    }
  }

  private emitGameState(
    state: RoomGameState,
    client?: AuthenticatedSocket,
  ): void {
    const payload = { ...state, serverTime: Date.now() };
    if (client) client.emit('game_state', payload);
    else this.server.to(`room:${state.roomId}`).emit('game_state', payload);
  }

  private async emitPersonalizedGameState(
    state: RoomGameState,
    client: AuthenticatedSocket,
  ): Promise<void> {
    const userId = this.extractUserIdFromToken(client);
    const answer = state.questionId
      ? await this.redisService.get<StoredRoomAnswer>(
          `room:${state.roomId}:answered:${userId}:${state.questionId}`,
        )
      : null;
    const leaderboard = await this.redisService.hashValuesJson<RoomScoreEntry>(
      `room:${state.roomId}:scores`,
    );
    const player = leaderboard.find((entry) => entry.userId === userId);
    client.emit('game_state', {
      ...state,
      serverTime: Date.now(),
      playerScore: Number(player?.score || 0),
      playerCorrectAnswers: Number(player?.correctAnswers || 0),
      answeredQuestionId: answer?.questionId,
      answeredOptionIds: answer?.selectedOptionIds,
      answeredText: answer?.textAnswer,
      questionResults: state.status === 'REVEAL' || state.status === 'FINISHED'
        ? state.questionResults || (state.questionId ? await this.getQuestionResults(state.roomId, state.questionId) : [])
        : undefined,
    });
  }

  private scheduleGameAdvance(state: RoomGameState): void {
    const current = this.gameTimers.get(state.roomId);
    if (current) clearTimeout(current);
    const target = state.status === 'QUESTION' ? state.deadline : state.status === 'REVEAL' ? state.revealEndsAt : undefined;
    if (!target) return;
    const timer = setTimeout(
      () => {
        void this.advanceGameState(state.roomId, state.version).catch(
          (error) => {
            this.logger.error(
              `Scheduled game advance failed for room ${state.roomId}: ${error instanceof Error ? error.message : String(error)}`,
            );
          },
        );
      },
      Math.max(0, target - Date.now()) + 25,
    );
    this.gameTimers.set(state.roomId, timer);
  }

  private async advanceGameState(
    roomId: string,
    expectedVersion: number,
  ): Promise<RoomGameState | null> {
    const state = await this.getGameState(roomId);
    if (
      !state ||
      !['QUESTION', 'REVEAL'].includes(state.status) ||
      state.version !== expectedVersion
    )
      return state;
    const lock = await this.redisService.setIfAbsent(
      `room:${roomId}:game:advance:${expectedVersion}`,
      '1',
      300,
    );
    if (!lock) return this.getGameState(roomId);
    if (state.status === 'QUESTION') {
      const questionResults = state.questionId
        ? await this.getQuestionResults(roomId, state.questionId)
        : [];
      const reveal: RoomGameState = {
        ...state,
        status: 'REVEAL',
        questionResults,
        revealEndsAt: Date.now() + 5000,
        version: Math.max(await this.nextGameRevision(roomId), state.version + 1),
        serverTime: Date.now(),
      };
      await this.setGameState(reveal);
      this.server.to(`room:${roomId}`).emit('game_state', reveal);
      this.server.to(`room:${roomId}`).emit('question_reveal', {
        roomId,
        questionId: reveal.questionId,
        questionResults,
        revealEndsAt: reveal.revealEndsAt,
        version: reveal.version,
      });
      this.scheduleGameAdvance(reveal);
      return reveal;
    }

    const nextIndex = state.questionIndex + 1;
    const question = await this.roomService.getNextQuestion(roomId, nextIndex);
    const version = Math.max(
      await this.nextGameRevision(roomId),
      state.version + 1,
    );
    if (!question) {
      const room = await this.roomService.getRoom(roomId);
      const finalLeaderboard = this.sortLeaderboard(
        await this.redisService.hashValuesJson<RoomScoreEntry>(
          `room:${roomId}:scores`,
        ),
      );
      await this.roomService.persistFinalLeaderboard(roomId, finalLeaderboard);
      await this.roomService.endGame(roomId, room.owner_id);
      const finished: RoomGameState = {
        roomId,
        status: 'FINISHED',
        questionIndex: state.questionIndex,
        version,
        serverTime: Date.now(),
      };
      await this.setGameState(finished);
      this.emitGameState(finished);
      return finished;
    }
    const nextState: RoomGameState = {
      roomId,
      status: 'QUESTION',
      questionIndex: nextIndex,
      questionId: question.questionId,
      questionStartedAt: Date.now(),
      deadline: Date.now() + Number(question.timeLimit || 30) * 1000,
      answeredCount: 0,
      rosterCount: state.rosterCount,
      version,
      serverTime: Date.now(),
    };
    await this.setGameState(nextState);
    this.emitGameState(nextState);
    this.scheduleGameAdvance(nextState);
    return nextState;
  }

  private extractUsernameFromToken(
    client: AuthenticatedSocket,
  ): string | undefined {
    const user = client.user?.user;
    if (user) return user.name || user.email || undefined;
    try {
      const token = (client as any).token;
      if (!token) return undefined;
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      );
      const username: string | undefined =
        payload.username || payload.full_name || payload.name || payload.email;
      return username;
    } catch {
      return undefined;
    }
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`🏠 Join room request from ${client.id}:`, data);

    const isLimited = await this.enforceSocketRateLimit(
      client,
      'join_room',
      20,
      60,
    );
    if (isLimited) {
      return;
    }

    try {
      if (!data.roomId) {
        this.logger.warn(`❌ No roomId provided by client ${client.id}`);
        client.emit('room_join_error', { error: 'Room ID is required' });
        return;
      }

      // Extract user ID from JWT token
      const userId = this.extractUserIdFromToken(client);
      this.cancelDisconnectCleanup(userId, data.roomId);

      this.logger.log(
        `🔄 Attempting to join room ${data.roomId} for user ${userId}`,
      );

      // Join room via service
      const result = await this.roomService.joinRoomViaWebSocket(
        userId,
        data.roomId,
      );

      this.logger.log(`✅ Successfully joined room:`, result);

      // Join socket to room
      await client.join(result.socket_room);
      // Track room for this socket
      const set = this.socketRooms.get(client.id) ?? new Set<string>();
      set.add(result.socket_room);
      this.socketRooms.set(client.id, set);

      // Emit success to client
      client.emit('room_joined', {
        roomId: result.room_id,
        roomCode: result.room_code,
        socketRoom: result.socket_room,
        message: `Successfully joined room ${result.room_code}`,
      });

      // Notify other participants in the room
      client.to(result.socket_room).emit('user_joined', {
        userId,
        roomId: result.room_id,
        message: `User joined the room`,
      });

      this.logger.log(
        `📢 Notified room ${result.socket_room} about new participant`,
      );

      await this.broadcastParticipants(result.room_id);
      const gameState = await this.getGameState(result.room_id);
      if (gameState) {
        await this.emitPersonalizedGameState(gameState, client);
        this.scheduleGameAdvance(gameState);
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to join room for client ${client.id}:`,
        error,
      );
      client.emit('room_join_error', {
        error: error.message || 'Failed to join room',
        roomId: data.roomId,
      });
    }
  }

  @SubscribeMessage('leave_room')
  async handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`🚪 Leave room request from ${client.id}:`, data);

    try {
      if (!data.roomId) {
        this.logger.warn(`❌ No roomId provided by client ${client.id}`);
        client.emit('room_leave_error', { error: 'Room ID is required' });
        return;
      }

      // Extract user ID from JWT token
      const userId = this.extractUserIdFromToken(client);
      this.cancelDisconnectCleanup(userId, data.roomId);

      this.logger.log(
        `🔄 Attempting to leave room ${data.roomId} for user ${userId}`,
      );

      // Leave socket from room
      const socketRoom = `room:${data.roomId}`;
      await client.leave(socketRoom);
      // Untrack room for this socket
      const set = this.socketRooms.get(client.id);
      if (set) {
        set.delete(socketRoom);
        if (set.size === 0) {
          this.socketRooms.delete(client.id);
        } else {
          this.socketRooms.set(client.id, set);
        }
      }

      this.logger.log(`✅ Successfully left room ${data.roomId}`);

      // Emit success to client
      client.emit('room_left', {
        roomId: data.roomId,
        message: `Successfully left room`,
      });

      const remainingSockets = await this.server.in(socketRoom).fetchSockets();
      if (
        remainingSockets.some(
          (socket) => String(socket.data?.userId || '') === userId,
        )
      ) {
        return;
      }

      await this.roomService.leaveRoomViaWebSocket(userId, data.roomId);

      // Notify other participants in the room
      client.to(socketRoom).emit('user_left', {
        userId,
        roomId: data.roomId,
        message: `User left the room`,
      });

      this.logger.log(
        `📢 Notified room ${socketRoom} about participant leaving`,
      );

      await this.broadcastParticipants(data.roomId);
    } catch (error) {
      this.logger.error(
        `❌ Failed to leave room for client ${client.id}:`,
        error,
      );
      client.emit('room_leave_error', {
        error: error.message || 'Failed to leave room',
        roomId: data.roomId,
      });
    }
  }

  @SubscribeMessage('get_participants')
  async handleGetParticipants(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`👥 Get participants request from ${client.id}:`, data);

    try {
      if (!data.roomId) {
        this.logger.warn(`❌ No roomId provided by client ${client.id}`);
        return;
      }

      const participants = await this.roomService.getParticipants(data.roomId);

      this.logger.log(
        `✅ Found ${participants.participants.length} participants in room ${data.roomId}`,
      );

      // Send participants list to client
      client.emit('participants_list', {
        roomId: data.roomId,
        participants: participants.participants,
        revision: await this.currentRoomRevision(data.roomId),
      });
    } catch (error) {
      this.logger.error(
        `❌ Failed to get participants for client ${client.id}:`,
        error,
      );
    }
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { roomId: string; message: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`💬 Send message request from ${client.id}:`, data);

    const isLimited = await this.enforceSocketRateLimit(
      client,
      'send_message',
      40,
      60,
    );
    if (isLimited) {
      return;
    }

    try {
      if (!data.roomId || !data.message) {
        this.logger.warn(
          `❌ Missing roomId or message from client ${client.id}`,
        );
        return;
      }

      // Extract identity
      const userId = this.extractUserIdFromToken(client);
      const usernameFromToken = this.extractUsernameFromToken(client);

      // Try enrich from participants list
      let displayName: string | undefined;
      let avatarUrl: string | null | undefined;
      try {
        const participants = await this.roomService.getParticipants(
          data.roomId,
        );
        const me = participants.participants.find((p) => p.user_id === userId);
        if (me) {
          displayName =
            (me as any).full_name || (me as any).username || undefined;
          avatarUrl = (me as any).avatar_url ?? null;
        }
      } catch (e) {
        this.logger.warn(
          `⚠️ Unable to enrich username from participants for room ${data.roomId}`,
        );
      }

      const messageData = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
        room_id: data.roomId,
        user_id: userId,
        username: displayName || usernameFromToken || userId.slice(0, 8),
        message: data.message,
        message_type: 'text' as const,
        created_at: new Date().toISOString(),
        avatar_url: avatarUrl ?? null,
      };

      this.logger.log(
        `📨 Broadcasting message to room ${data.roomId}:`,
        messageData,
      );

      // Broadcast message to all clients in the room
      const socketRoom = `room:${data.roomId}`;
      try {
        await this.redisService.listPushJson(
          `room:${data.roomId}:messages`,
          messageData,
          200,
          86400,
        );
      } catch {
        if (!this.roomMessages.has(data.roomId))
          this.roomMessages.set(data.roomId, []);
        const fallback = this.roomMessages.get(data.roomId)!;
        fallback.push(messageData);
        if (fallback.length > 200) fallback.splice(0, fallback.length - 200);
      }
      this.server.to(socketRoom).emit('room_message', messageData);

      this.logger.log(`✅ Message broadcasted to room ${socketRoom}`);
    } catch (error) {
      this.logger.error(
        `❌ Failed to send message for client ${client.id}:`,
        error,
      );
    }
  }

  @SubscribeMessage('get_messages')
  async handleGetMessages(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`📨 Get messages request from ${client.id}:`, data);

    try {
      if (!data.roomId) {
        this.logger.warn(`❌ No roomId provided by client ${client.id}`);
        return;
      }

      let messages;
      try {
        messages = await this.redisService.listRangeJson(
          `room:${data.roomId}:messages`,
          0,
          -1,
        );
      } catch {
        messages = this.roomMessages.get(data.roomId) || [];
      }

      this.logger.log(
        `📨 Sending ${messages.length} messages to client ${client.id}`,
      );

      client.emit('messages_list', messages);
    } catch (error) {
      this.logger.error(
        `❌ Failed to get messages for client ${client.id}:`,
        error,
      );
    }
  }

  @SubscribeMessage('invite_friends')
  async handleInviteFriends(
    @MessageBody() data: { roomId: string; friendIds: string[] },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`👥 Invite friends request from ${client.id}:`, data);

    try {
      if (!data.roomId || !data.friendIds?.length) {
        this.logger.warn(
          `❌ Missing roomId or friendIds from client ${client.id}`,
        );
        return;
      }

      const userId = this.extractUserIdFromToken(client);
      const result = await this.roomService.inviteFriends(userId, data.roomId, data.friendIds);
      client.emit('room_invitation_result', result);
    } catch (error) {
      this.logger.error(
        `❌ Failed to invite friends for client ${client.id}:`,
        error,
      );
    }
  }

  @SubscribeMessage('get_room_status')
  async handleGetRoomStatus(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`📊 Get room status request from ${client.id}:`, data);

    try {
      if (!data.roomId) {
        this.logger.warn(`❌ No roomId provided by client ${client.id}`);
        return;
      }

      const room = await this.roomService.getRoom(data.roomId);
      const participants = await this.roomService.getParticipants(data.roomId);

      const roomStatus = {
        roomId: room.id,
        roomCode: room.room_code,
        status: room.status,
        currentParticipants: room.current_participants,
        maxParticipants: room.max_participants,
        isPrivate: room.is_private,
        participants: participants.participants,
        liveSockets: participants.live_sockets,
      };

      this.logger.log(`📊 Room status for ${data.roomId}:`, roomStatus);

      client.emit('room_status', roomStatus);
    } catch (error) {
      this.logger.error(
        `❌ Failed to get room status for client ${client.id}:`,
        error,
      );
    }
  }

  @SubscribeMessage('start_game')
  async handleStartGame(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const userId = this.extractUserIdFromToken(client);
      const room = await this.roomService.getRoom(data.roomId);
      if (room.owner_id !== userId)
        throw new Error('Only room owner can start the game');
      const existing = await this.getGameState(data.roomId);
      if (existing?.status === 'QUESTION' || existing?.status === 'REVEAL' || existing?.status === 'FINISHED') {
        await this.emitPersonalizedGameState(existing, client);
        return;
      }
      await this.roomService.startGame(data.roomId, userId);
      const question = await this.roomService.getNextQuestion(data.roomId, 0);
      if (!question) throw new Error('Quiz has no questions');
      const roster = await this.getRoster(data.roomId);
      for (const player of roster) {
        await this.redisService.hashSetJson(
          `room:${data.roomId}:scores`,
          player.userId,
          {
            userId: player.userId,
            username: player.username,
            score: 0,
            correctAnswers: 0,
            totalTimeMs: 0,
            timestamp: new Date().toISOString(),
          } satisfies RoomScoreEntry,
          21600,
        );
      }
      const questionStartedAt = Date.now();
      const state: RoomGameState = {
        roomId: data.roomId,
        status: 'QUESTION',
        questionIndex: 0,
        questionId: question.questionId,
        questionStartedAt,
        deadline: questionStartedAt + Number(question.timeLimit || 30) * 1000,
        answeredCount: 0,
        rosterCount: roster.length,
        version: await this.nextGameRevision(data.roomId),
        serverTime: Date.now(),
      };
      await this.setGameState(state);
      this.emitGameState(state);
      await this.emitPersonalizedGameState(state, client);
      this.scheduleGameAdvance(state);
    } catch (error) {
      client.emit('game_error', {
        error: error instanceof Error ? error.message : 'Failed to start game',
      });
    }
  }

  @SubscribeMessage('get_game_state')
  async handleGetGameState(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      let state = await this.getGameState(data.roomId);
      if (!state) {
        const room = await this.roomService.getRoom(data.roomId);
        const settings =
          room.settings &&
          typeof room.settings === 'object' &&
          !Array.isArray(room.settings)
            ? (room.settings as Record<string, unknown>)
            : {};
        const persisted = settings.gameSnapshot as RoomGameState | undefined;
        if (persisted) {
          state = persisted;
        } else if (room.status === 'IN_GAME') {
          const question = await this.roomService.getNextQuestion(
            data.roomId,
            0,
          );
          state = question
            ? {
                roomId: data.roomId,
                status: 'QUESTION',
                questionIndex: 0,
                questionId: question.questionId,
                questionStartedAt: Date.now(),
                deadline: Date.now() + Number(question.timeLimit || 30) * 1000,
                answeredCount: 0,
                rosterCount: (await this.getRoster(data.roomId)).length,
                version: await this.nextGameRevision(data.roomId),
                serverTime: Date.now(),
              }
            : {
                roomId: data.roomId,
                status: 'FINISHED',
                questionIndex: 0,
                version: await this.nextGameRevision(data.roomId),
                serverTime: Date.now(),
              };
          await this.setGameState(state);
        } else {
          state = {
            roomId: data.roomId,
            status: room.status === 'CLOSED' ? 'FINISHED' : 'WAITING',
            questionIndex: 0,
            version: 0,
            serverTime: Date.now(),
          };
        }
      }
      if (
        state.status === 'QUESTION' &&
        state.deadline &&
        state.deadline <= Date.now()
      ) {
        state = await this.advanceGameState(data.roomId, state.version);
      } else if (
        state.status === 'REVEAL' &&
        state.revealEndsAt &&
        state.revealEndsAt <= Date.now()
      ) {
        state = await this.advanceGameState(data.roomId, state.version);
      }
      if (!state) throw new Error('Game state is unavailable');
      if (state.questionId) {
        try {
          state = {
            ...state,
            answeredCount: Number(await this.redisService.get<number>(`room:${data.roomId}:answered-count:${state.questionId}`) || state.answeredCount || 0),
          };
        } catch {
          // Durable snapshot still contains the last known count.
        }
      }
      this.scheduleGameAdvance(state);
      await this.emitPersonalizedGameState(state, client);
    } catch (error) {
      client.emit('game_error', {
        error:
          error instanceof Error ? error.message : 'Failed to load game state',
      });
    }
  }

  @SubscribeMessage('advance_question')
  async handleAdvanceQuestion(
    @MessageBody() data: { roomId: string; expectedVersion: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      const userId = this.extractUserIdFromToken(client);
      const room = await this.roomService.getRoom(data.roomId);
      if (room.owner_id !== userId)
        throw new Error('Only room owner can advance questions');
      const state = await this.getGameState(data.roomId);
      if (!state || state.status !== 'REVEAL' || (state.revealEndsAt && state.revealEndsAt > Date.now())) {
        throw new Error('Questions advance automatically after the 5-second reveal');
      }
      await this.advanceGameState(data.roomId, Number(data.expectedVersion));
    } catch (error) {
      client.emit('game_error', {
        error:
          error instanceof Error ? error.message : 'Failed to advance question',
      });
    }
  }

  @SubscribeMessage('submit_answer')
  async handleSubmitAnswer(
    @MessageBody()
    data: {
      roomId: string;
      questionId: string;
      selectedOptionId?: string;
      selectedOptionIds?: string[];
      timeSpent?: number;
      commandId: string;
    },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    let answerKey = '';
    let answerLockAcquired = false;
    try {
      if (!data.roomId || !data.questionId || !data.commandId) {
        client.emit('answer_error', {
          error: 'roomId, questionId and commandId are required',
        });
        return;
      }
      const userId = this.extractUserIdFromToken(client);
      const state = await this.getGameState(data.roomId);
      if (!state || state.status !== 'QUESTION' || state.questionId !== data.questionId) {
        throw new Error('Question is no longer accepting answers');
      }
      const receivedAt = Date.now();
      if (state.deadline && receivedAt > state.deadline) {
        await this.advanceGameState(data.roomId, state.version);
        throw new Error('Question time has expired');
      }
      answerKey = `room:${data.roomId}:answered:${userId}:${data.questionId}`;
      answerLockAcquired = await this.redisService.setIfAbsent(
        answerKey,
        { status: 'processing' },
        30,
      );
      if (!answerLockAcquired) {
        const previousAnswer =
          await this.redisService.get<StoredRoomAnswer>(answerKey);
        client.emit('answer_result', {
          commandId: data.commandId,
          questionId: data.questionId,
          ...(previousAnswer?.questionId ? previousAnswer : {}),
          duplicate: true,
        });
        return;
      }
      const answer = data.selectedOptionIds?.length
        ? data.selectedOptionIds
        : data.selectedOptionId || '';
      const responseTimeMs = Math.max(0, receivedAt - Number(state.questionStartedAt || receivedAt));
      const result = await this.roomService.submitAnswer(
        userId,
        data.roomId,
        data.questionId,
        answer,
        Math.ceil(responseTimeMs / 1000),
      );
      const durationMs = Math.max(1, Number(state.deadline || receivedAt) - Number(state.questionStartedAt || receivedAt));
      const speedFactor = Math.max(0.5, Math.min(1, 1 - (responseTimeMs / durationMs) * 0.5));
      const points = result.isCorrect ? Math.round(Number(result.points || 0) * speedFactor * 100) / 100 : 0;
      const answeredAt = new Date(receivedAt).toISOString();
      const durableAnswer = {
        userId,
        questionId: data.questionId,
        selectedOptionIds: Array.isArray(answer) ? answer : answer ? [answer] : [],
        isCorrect: result.isCorrect,
        points,
        responseTimeMs,
        answeredAt,
      };
      await this.redisService.set(
        answerKey,
        {
          questionId: data.questionId,
          commandId: data.commandId,
          ...result,
          points,
          responseTimeMs,
          answeredAt,
          selectedOptionIds: Array.isArray(answer) ? answer : answer ? [answer] : [],
          textAnswer: typeof answer === 'string' ? answer : undefined,
        } satisfies StoredRoomAnswer,
        21600,
      );
      if (typeof (this.roomService as any).persistRealtimeAnswer === 'function') {
        void (this.roomService as any).persistRealtimeAnswer(data.roomId, durableAnswer).catch((persistError: unknown) => {
          this.logger.warn(`Realtime answer persistence deferred for room ${data.roomId}: ${persistError instanceof Error ? persistError.message : String(persistError)}`);
        });
      }
      const username = this.extractUsernameFromToken(client) || 'Unknown';
      const scoreKey = `room:${data.roomId}:scores`;
      const leaderboard =
        await this.redisService.hashValuesJson<RoomScoreEntry>(scoreKey);
      const previous = leaderboard.find((entry) => entry.userId === userId);
      const updateData = {
        userId,
        username,
        score: Number(previous?.score || 0) + points,
        correctAnswers:
          Number(previous?.correctAnswers || 0) + (result.isCorrect ? 1 : 0),
        timestamp: new Date().toISOString(),
        totalTimeMs: Number(previous?.totalTimeMs || 0) + responseTimeMs,
      };
      await this.redisService.hashSetJson(scoreKey, userId, updateData, 21600);
      const updatedLeaderboard = this.sortLeaderboard(
        await this.redisService.hashValuesJson<RoomScoreEntry>(scoreKey),
      );
      client.emit('answer_result', {
        commandId: data.commandId,
        questionId: data.questionId,
        ...result,
        points,
        responseTimeMs,
        answeredAt,
      });
      this.server.to(`room:${data.roomId}`).emit('score_updated', updateData);
      this.server
        .to(`room:${data.roomId}`)
        .emit('leaderboard_update', updatedLeaderboard);
      const answeredCount = await this.redisService.incrementWithTtl(
        `room:${data.roomId}:answered-count:${data.questionId}`,
        21600,
      );
      this.server.to(`room:${data.roomId}`).emit('answer_progress', {
        roomId: data.roomId,
        questionId: data.questionId,
        answeredCount: Number(answeredCount),
        rosterCount: state.rosterCount || 0,
      });
      if (state.rosterCount && Number(answeredCount) >= state.rosterCount) {
        await this.advanceGameState(data.roomId, state.version);
      }
    } catch (error) {
      if (answerLockAcquired && answerKey) {
        await this.redisService.del(answerKey);
      }
      client.emit('answer_error', {
        commandId: data.commandId,
        error:
          error instanceof Error ? error.message : 'Failed to submit answer',
      });
    }
  }

  @SubscribeMessage('update_score')
  async handleUpdateScore(
    @MessageBody()
    data: { roomId: string; score: number; correctAnswers: number },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    void data;
    client.emit('score_update_rejected', {
      error: 'Client-controlled score updates are disabled. Use submit_answer.',
    });
  }

  @SubscribeMessage('get_leaderboard')
  async handleGetLeaderboard(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    this.logger.log(`🏆 Get leaderboard request from ${client.id}:`, data);

    try {
      if (!data.roomId) return;

      let leaderboard;
      try {
        leaderboard = await this.redisService.hashValuesJson(
          `room:${data.roomId}:scores`,
        );
        if (!leaderboard?.length && typeof (this.roomService as any).getPersistedFinalLeaderboard === 'function') {
          leaderboard = await (this.roomService as any).getPersistedFinalLeaderboard(data.roomId);
        }
      } catch {
        leaderboard = this.roomScores.has(data.roomId)
          ? Array.from(this.roomScores.get(data.roomId)!.values())
          : (typeof (this.roomService as any).getPersistedFinalLeaderboard === 'function'
            ? await (this.roomService as any).getPersistedFinalLeaderboard(data.roomId)
            : []);
      }

      client.emit('leaderboard_update', this.sortLeaderboard(leaderboard as RoomScoreEntry[]));
    } catch (error) {
      this.logger.error(
        `❌ Failed to get leaderboard for client ${client.id}:`,
        error,
      );
    }
  }
}

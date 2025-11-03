import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { RoomService } from '../services/room.service';
import { EventRepository } from '@/common/repositories/event.repository';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';

interface AuthenticatedSocket extends Socket {
  user?: AuthDto;
}

@Injectable()
@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
export class RoomWebSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RoomWebSocketGateway.name);
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

  constructor(
    private readonly roomService: RoomService,
    private readonly eventRepository: EventRepository,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`🔌 Room WebSocket connected: ${client.id}`);

    try {
      // Get user from JWT token in handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        this.logger.warn(`❌ No token provided for client: ${client.id}`);
        client.disconnect();
        return;
      }

      // TODO: Verify JWT token and get user info
      // For now, we'll assume authentication is handled elsewhere
      this.logger.log(
        `✅ Client ${client.id} authenticated with token: ${token.substring(0, 20)}...`,
      );

      // Store token in socket for later use
      (client as any).token = token;
    } catch (error) {
      this.logger.error(
        `❌ Authentication failed for client ${client.id}:`,
        error,
      );
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`🔌 Room WebSocket disconnected: ${client.id}`);
  }

  private extractUserIdFromToken(client: AuthenticatedSocket): string {
    // Prefer deriving from rooms joined by EventRepository (auth gateway)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const candidate = Array.from(client.rooms).find((r) => uuidRegex.test(r));
    if (candidate) {
      this.logger.log(
        `✅ Derived user ID from client rooms: ${candidate} for ${client.id}`,
      );
      return candidate;
    }

    // Fallback: naive JWT decode from stored token
    try {
      const token = (client as any).token;
      if (!token) {
        this.logger.warn(`❌ No token found for client ${client.id}`);
        return 'temp-user-id';
      }
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
      );
      const userId = payload.sub || payload.userId || payload.id;
      if (!userId) {
        this.logger.warn(
          `❌ No user ID found in token for client ${client.id}`,
        );
        return 'temp-user-id';
      }
      this.logger.log(
        `✅ Extracted user ID (fallback): ${userId} for client ${client.id}`,
      );
      return userId;
    } catch (error) {
      this.logger.error(
        `❌ Failed to extract user ID for client ${client.id}:`,
        error,
      );
      return 'temp-user-id';
    }
  }

  private extractUsernameFromToken(
    client: AuthenticatedSocket,
  ): string | undefined {
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

    try {
      if (!data.roomId) {
        this.logger.warn(`❌ No roomId provided by client ${client.id}`);
        client.emit('room_join_error', { error: 'Room ID is required' });
        return;
      }

      // Extract user ID from JWT token
      const userId = this.extractUserIdFromToken(client);
      const usernameFromToken = this.extractUsernameFromToken(client);

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

      // Broadcast updated participants list to the room
      try {
        const participants = await this.roomService.getParticipants(
          result.room_id,
        );
        this.server.to(result.socket_room).emit('participants_list', {
          roomId: result.room_id,
          participants: participants.participants,
        });
        this.logger.log(
          `👥 Broadcasted participants_list to ${result.socket_room} (${participants.participants.length} users)`,
        );
      } catch (err) {
        this.logger.warn(
          `⚠️ Failed to broadcast participants_list after join:`,
          err,
        );
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

      this.logger.log(
        `🔄 Attempting to leave room ${data.roomId} for user ${userId}`,
      );

      // Leave room via service
      await this.roomService.leaveRoomViaWebSocket(userId, data.roomId);

      // Leave socket from room
      const socketRoom = `room:${data.roomId}`;
      await client.leave(socketRoom);

      this.logger.log(`✅ Successfully left room ${data.roomId}`);

      // Emit success to client
      client.emit('room_left', {
        roomId: data.roomId,
        message: `Successfully left room`,
      });

      // Notify other participants in the room
      client.to(socketRoom).emit('user_left', {
        userId,
        roomId: data.roomId,
        message: `User left the room`,
      });

      this.logger.log(
        `📢 Notified room ${socketRoom} about participant leaving`,
      );

      // Broadcast updated participants list to the room
      try {
        const participants = await this.roomService.getParticipants(
          data.roomId,
        );
        this.server.to(socketRoom).emit('participants_list', {
          roomId: data.roomId,
          participants: participants.participants,
        });
        this.logger.log(
          `👥 Broadcasted participants_list to ${socketRoom} (${participants.participants.length} users)`,
        );
      } catch (err) {
        this.logger.warn(
          `⚠️ Failed to broadcast participants_list after leave:`,
          err,
        );
      }
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

      // Log chi tiết participants
      this.logger.log(`👥 Participants details:`, participants.participants);
      this.logger.log(`🔌 Live sockets:`, participants.live_sockets);

      // Send participants list to client
      client.emit('participants_list', {
        roomId: data.roomId,
        participants: participants.participants,
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
      // Store in-memory
      if (!this.roomMessages.has(data.roomId)) {
        this.roomMessages.set(data.roomId, []);
      }
      this.roomMessages.get(data.roomId)!.push(messageData);
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

      // Return in-memory messages for now
      const messages = this.roomMessages.get(data.roomId) || [];

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

      // TODO: Implement invite friends logic
      this.logger.log(
        `📧 Inviting ${data.friendIds.length} friends to room ${data.roomId}`,
      );

      // Notify invited friends
      for (const friendId of data.friendIds) {
        this.server.to(friendId).emit('room_invitation', {
          roomId: data.roomId,
          message: `You've been invited to join a room`,
        });
      }

      this.logger.log(
        `✅ Invitations sent to ${data.friendIds.length} friends`,
      );
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
}

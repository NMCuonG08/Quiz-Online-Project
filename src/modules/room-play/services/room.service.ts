import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
import { CreateRoomDto } from '../dtos/create-room.dto';
import { UpdateRoomDto } from '../dtos/update-room.dto';
import { RoomPaginationDto } from '../dtos/room-pagination.dto';
import { PaginatedResponseDto } from '@/common/dtos/responses/base.response';
import { JoinRoomDto } from '../dtos/join-room.dto';
import { QuizRoom } from '@prisma/client';

@Injectable()
export class RoomService extends BaseService {
  async createRoom(userId: string, dto: CreateRoomDto): Promise<QuizRoom> {
    const roomCode =
      dto.room_code || this.cryptoRepository.randomBytesAsText(6);
    const exists = await this.roomRepository.findByCode(roomCode);
    if (exists) {
      throw new BadRequestException('Room code already exists');
    }
    const quiz = await this.quizRepository.findUnique({ id: dto.quiz_id });
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    const created = await this.roomRepository.create({
      quiz_id: dto.quiz_id,
      owner_id: userId,
      room_code: roomCode,
      is_private: dto.is_private ?? false,
      password_hash: dto.password
        ? await this.cryptoRepository.hashBcrypt(dto.password, 10)
        : null,
      max_participants: dto.max_participants ?? 100,
      settings: dto.settings ?? {},
    });

    // Notify owner about created room, client can join socket room by code or id
    await this.eventRepository.emit('Notification', {
      userId,
      message: `Room created: ${created.room_code}`,
    });

    // Auto-join owner sockets to this room if status is OPEN
    if (created.status === 'OPEN') {
      const socketRoom = `room:${created.id}`;
      await this.eventRepository.joinUserToRoom(userId, socketRoom);
    }

    return created;
  }

  async listRooms(
    pagination: RoomPaginationDto,
  ): Promise<PaginatedResponseDto<QuizRoom>> {
    const result = await this.roomRepository.paginate(pagination);
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getRoom(id: string): Promise<QuizRoom> {
    const room = await this.roomRepository.findUnique({ id });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async updateRoom(
    userId: string,
    id: string,
    dto: UpdateRoomDto,
  ): Promise<QuizRoom> {
    const room = await this.roomRepository.findUnique({ id });
    if (!room) throw new NotFoundException('Room not found');
    if (room.owner_id !== userId)
      throw new ForbiddenException('Only owner can update room');

    const data: Partial<QuizRoom> & { password?: string } = { ...dto } as any;
    if (dto.password) {
      data.password_hash = await this.cryptoRepository.hashBcrypt(
        dto.password,
        10,
      );
      delete data.password;
    }

    return this.roomRepository.update({ id }, data);
  }

  async deleteRoom(userId: string, id: string): Promise<string> {
    const room = await this.roomRepository.findUnique({ id });
    if (!room) throw new NotFoundException('Room not found');
    if (room.owner_id !== userId)
      throw new ForbiddenException('Only owner can delete room');
    await this.roomRepository.delete({ id });
    return 'Room deleted successfully';
  }

  async joinRoom(
    userId: string,
    roomId: string,
    dto: JoinRoomDto,
  ): Promise<{ room_id: string; room_code: string; socket_room: string }> {
    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) throw new NotFoundException('Room not found');

    if (room.is_private) {
      if (!dto.password || !room.password_hash) {
        throw new ForbiddenException('Password required');
      }
      const ok = this.cryptoRepository.compareBcrypt(
        dto.password,
        room.password_hash,
      );
      if (!ok) throw new ForbiddenException('Invalid password');
    }

    if (room.current_participants >= room.max_participants) {
      throw new ForbiddenException('Room full');
    }

    // upsert participant and increment count
    await this.prisma.$transaction([
      this.prisma.roomParticipant.upsert({
        where: { room_id_user_id: { room_id: roomId, user_id: userId } },
        create: { room_id: roomId, user_id: userId },
        update: { status: 'JOINED' },
      }),
      this.prisma.quizRoom.update({
        where: { id: roomId },
        data: { current_participants: { increment: 1 } },
      }),
    ]);

    // Tell client which socket room to join
    const socketRoom = `room:${roomId}`;
    // Auto-join caller's active sockets to this room
    await this.eventRepository.joinUserToRoom(userId, socketRoom);
    await this.eventRepository.emit('Notification', {
      userId,
      message: `Joined room ${room.room_code}. Socket room: ${socketRoom}`,
    });

    return {
      room_id: roomId,
      room_code: room.room_code,
      socket_room: socketRoom,
    };
  }

  async getParticipants(roomId: string): Promise<{
    room_id: string;
    participants: Array<{
      user_id: string;
      joined_at: Date;
      status: string;
    }>;
    live_sockets: string[];
  }> {
    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) throw new NotFoundException('Room not found');

    const rows = await this.roomRepository.findParticipants(roomId);
    const participants = rows.map((r) => ({
      user_id: r.user_id,
      joined_at: r.joined_at,
      status: r.status,
    }));

    const socketRoom = `room:${roomId}`;
    const live_sockets =
      await this.eventRepository.listSocketsInRoom(socketRoom);

    return { room_id: roomId, participants, live_sockets };
  }
}

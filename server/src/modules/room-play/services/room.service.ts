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
import { Prisma, QuizRoom } from '@prisma/client';
import type { $Enums } from '@prisma/client';

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

    await this.eventRepository.emit('RoomCreated', {
      id: created.id,
      ownerId: userId,
    });

    // Notify owner about created room, client can join socket room by code or id
    await this.eventRepository.emit('Notification', {
      userId,
      title: 'Tạo phòng thành công',
      type: 'success',
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

  async listRoomsByQuizId(
    quizId: string,
    pagination: RoomPaginationDto,
  ): Promise<PaginatedResponseDto<QuizRoom>> {
    try {
      console.log(
        `🔍 RoomService: listRoomsByQuizId called with quizId: ${quizId}, status: ${pagination.status}`,
      );

      // First check if quiz exists
      const quiz = await this.quizRepository.findUnique({ id: quizId });
      if (!quiz) {
        console.log(`❌ RoomService: Quiz with ID ${quizId} not found`);
        throw new NotFoundException(`Quiz with ID ${quizId} not found`);
      }

      const whereClause: Record<string, any> = {
        quiz_id: quizId,
      };

      // Add status filter if provided
      if (pagination.status) {
        whereClause.status = pagination.status;
      }

      // Add room_code filter if provided
      if (pagination.room_code) {
        whereClause.room_code = pagination.room_code;
      }

      console.log(`📊 RoomService: Query whereClause:`, whereClause);

      const result = await this.roomRepository.paginate(
        pagination,
        whereClause,
      );

      console.log(
        `✅ RoomService: Found ${result.data.length} rooms for quizId: ${quizId}`,
      );

      return new PaginatedResponseDto(
        result.data,
        result.meta.page,
        result.meta.limit,
        result.meta.total,
      );
    } catch (error) {
      console.error(
        `💥 RoomService: Error in listRoomsByQuizId for quizId ${quizId}:`,
        error,
      );
      throw error;
    }
  }

  async listRoomsByQuizSlug(
    quizSlug: string,
    pagination: RoomPaginationDto,
  ): Promise<PaginatedResponseDto<QuizRoom>> {
    // First find the quiz by slug
    const quiz = await this.quizRepository.findBySlug(quizSlug);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const whereClause: Record<string, any> = {
      quiz_id: quiz.id,
    };

    // Add status filter if provided
    if (pagination.status) {
      whereClause.status = pagination.status;
    }

    // Add room_code filter if provided
    if (pagination.room_code) {
      whereClause.room_code = pagination.room_code;
    }

    const result = await this.roomRepository.paginate(pagination, whereClause);
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

  async getRoomByCode(roomCode: string): Promise<QuizRoom> {
    const room = await this.roomRepository.findByCode(roomCode);
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

    const data: Partial<QuizRoom> & { password?: string } = {
      ...dto,
    } as Partial<QuizRoom> & { password?: string };
    if (dto.password) {
      data.password_hash = await this.cryptoRepository.hashBcrypt(
        dto.password,
        10,
      );
      delete data.password;
    }

    const updated = await this.roomRepository.update({ id }, data);
    await this.eventRepository.emit('RoomUpdated', {
      id,
      ownerId: userId,
    });
    return updated;
  }

  async deleteRoom(userId: string, id: string): Promise<string> {
    const room = await this.roomRepository.findUnique({ id });
    if (!room) throw new NotFoundException('Room not found');
    if (room.owner_id !== userId)
      throw new ForbiddenException('Only owner can delete room');
    await this.roomRepository.delete({ id });
    await this.eventRepository.emit('RoomDeleted', {
      id,
      ownerId: userId,
    });
    return 'Room deleted successfully';
  }

  async joinRoom(
    userId: string,
    roomId: string,
    dto: JoinRoomDto,
  ): Promise<{ room_id: string; room_code: string; socket_room: string }> {
    // Validate UUID format

    if (!this.isValidUUID(roomId)) {
      throw new BadRequestException('Invalid room ID format');
    }

    if (!this.isValidUUID(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

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

    await this.activateParticipant(userId, roomId);

    // Tell client which socket room to join
    const socketRoom = `room:${roomId}`;
    // Auto-join caller's active sockets to this room
    await this.eventRepository.joinUserToRoom(userId, socketRoom);
    await this.eventRepository.emit('Notification', {
      userId,
      title: 'Đã vào phòng',
      type: 'info',
      message: `Joined room ${room.room_code}. Socket room: ${socketRoom}`,
    });

    // No WS broadcast here (revert): WS gateway handles realtime on joinRoomViaWebSocket

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
      username?: string | null;
      full_name?: string | null;
      avatar_url?: string | null;
    }>;
    live_sockets: string[];
  }> {
    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) throw new NotFoundException('Room not found');

    const rows = await this.roomRepository.findParticipants(roomId);

    // Enrich with user profile (username, full_name, avatar -> avatar_url)
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, full_name: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const participants = rows.map((r) => {
      const u = userMap.get(r.user_id);
      return {
        user_id: r.user_id,
        joined_at: r.joined_at,
        status: r.status,
        username: u?.username ?? null,
        full_name: u?.full_name ?? null,
        avatar_url: u?.avatar ?? null,
      };
    });

    const socketRoom = `room:${roomId}`;
    const live_sockets =
      await this.eventRepository.listSocketsInRoom(socketRoom);
    return { room_id: roomId, participants, live_sockets };
  }

  async joinRoomViaWebSocket(
    userId: string,
    roomId: string,
  ): Promise<{ room_id: string; room_code: string; socket_room: string }> {
    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    await this.activateParticipant(userId, roomId);

    // Tell client which socket room to join
    const socketRoom = `room:${roomId}`;
    // Auto-join caller's active sockets to this room
    await this.eventRepository.joinUserToRoom(userId, socketRoom);
    await this.eventRepository.emit('Notification', {
      userId,
      title: 'Đã vào phòng',
      type: 'info',
      message: `Joined room ${room.room_code}. Socket room: ${socketRoom}`,
    });

    // No broadcast here in the original behavior

    return {
      room_id: roomId,
      room_code: room.room_code,
      socket_room: socketRoom,
    };
  }

  async leaveRoomViaWebSocket(userId: string, roomId: string): Promise<void> {
    // Validate UUID format
    if (!this.isValidUUID(roomId)) {
      throw new BadRequestException('Invalid room ID format');
    }

    if (!this.isValidUUID(userId)) {
      throw new BadRequestException('Invalid user ID format');
    }

    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) throw new NotFoundException('Room not found');

    await this.prisma.$transaction(
      async (tx) => {
        const participant = await tx.roomParticipant.findUnique({
          where: { room_id_user_id: { room_id: roomId, user_id: userId } },
        });
        if (
          !participant ||
          !['JOINED', 'ACTIVE'].includes(participant.status)
        ) {
          return;
        }
        await tx.roomParticipant.update({
          where: { id: participant.id },
          data: { status: 'DISCONNECTED', left_at: new Date() },
        });
        const activeCount = await tx.roomParticipant.count({
          where: { room_id: roomId, status: { in: ['JOINED', 'ACTIVE'] } },
        });
        await tx.quizRoom.update({
          where: { id: roomId },
          data: { current_participants: activeCount },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    await this.eventRepository.emit('Notification', {
      userId,
      title: 'Đã rời phòng',
      type: 'info',
      message: `Left room ${room.room_code}`,
    });

    // No broadcast here in the original behavior
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  private async activateParticipant(
    userId: string,
    roomId: string,
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        const room = await tx.quizRoom.findUnique({ where: { id: roomId } });
        if (!room) throw new NotFoundException('Room not found');
        const participant = await tx.roomParticipant.findUnique({
          where: { room_id_user_id: { room_id: roomId, user_id: userId } },
        });
        if (participant && ['JOINED', 'ACTIVE'].includes(participant.status)) {
          const activeCount = await tx.roomParticipant.count({
            where: { room_id: roomId, status: { in: ['JOINED', 'ACTIVE'] } },
          });
          if (room.current_participants !== activeCount) {
            await tx.quizRoom.update({
              where: { id: roomId },
              data: { current_participants: activeCount },
            });
          }
          return;
        }
        const activeCount = await tx.roomParticipant.count({
          where: { room_id: roomId, status: { in: ['JOINED', 'ACTIVE'] } },
        });
        if (activeCount >= room.max_participants)
          throw new ForbiddenException('Room full');
        await tx.roomParticipant.upsert({
          where: { room_id_user_id: { room_id: roomId, user_id: userId } },
          create: { room_id: roomId, user_id: userId, status: 'JOINED' },
          update: { status: 'JOINED', left_at: null },
        });
        await tx.quizRoom.update({
          where: { id: roomId },
          data: { current_participants: activeCount + 1 },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  // ============= GAME PLAY METHODS =============

  async startGame(roomId: string, userId: string): Promise<void> {
    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) throw new NotFoundException('Room not found');
    if (room.owner_id !== userId) {
      throw new ForbiddenException('Only room owner can start the game');
    }
    if (room.status !== 'OPEN') {
      throw new BadRequestException('Game already started or ended');
    }
    await this.prisma.$transaction([
      this.prisma.quizRoom.update({
        where: { id: roomId },
        data: { status: 'IN_GAME' },
      }),
      this.prisma.roomParticipant.updateMany({
        where: { room_id: roomId, status: 'JOINED' },
        data: { status: 'ACTIVE' },
      }),
    ]);
  }

  async getNextQuestion(
    roomId: string,
    currentQuestionNumber: number,
  ): Promise<any> {
    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) throw new NotFoundException('Room not found');

    // Get quiz questions
    const quiz = await this.prisma.quiz.findUnique({
      where: { id: room.quiz_id },
      include: { questions: { orderBy: { sort_order: 'asc' } } },
    });
    if (!quiz) throw new NotFoundException('Quiz not found');

    type QuestionType = {
      id: string;
      question_text: string;
      time_limit?: number;
    };
    type QuizWithQuestions = typeof quiz & { questions: QuestionType[] };
    const quizWithQuestions = quiz as QuizWithQuestions;
    const questions = quizWithQuestions.questions || [];
    const question = questions[currentQuestionNumber];
    if (!question) return null; // No more questions

    return {
      questionId: question.id,
      question: question.question_text,
      timeLimit: question.time_limit || 30,
      questionNumber: currentQuestionNumber + 1,
      totalQuestions: questions.length,
    };
  }

  async submitAnswer(
    userId: string,
    roomId: string,
    questionId: string,
    answer: string | string[],
    timeSpent: number, // reserved for server-side time bonus rules
  ): Promise<{ isCorrect: boolean; correctAnswer: string; points: number }> {
    void timeSpent;
    // Verify room and participant
    const participant = await this.prisma.roomParticipant.findFirst({
      where: {
        room_id: roomId,
        user_id: userId,
        status: { in: ['JOINED', 'ACTIVE'] as $Enums.ParticipantStatus[] },
      },
    });
    if (!participant) {
      throw new ForbiddenException('Not an active participant');
    }

    const room = await this.prisma.quizRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });
    if (!question) throw new NotFoundException('Question not found');
    if (question.quiz_id !== room.quiz_id) {
      throw new ForbiddenException('Question does not belong to this room');
    }

    const selected = new Set(
      (Array.isArray(answer) ? answer : [answer]).filter(Boolean),
    );
    const correctOptions = question.options.filter(
      (option) => option.is_correct,
    );
    const correctIds = new Set(correctOptions.map((option) => option.id));
    const isCorrect =
      selected.size === correctIds.size &&
      Array.from(selected).every((id) => correctIds.has(id));
    return {
      isCorrect,
      correctAnswer: correctOptions
        .map((option) => option.option_text)
        .join(', '),
      points: isCorrect ? question.points : 0,
    };
  }

  async getLeaderboard(roomId: string): Promise<any[]> {
    // RoomParticipant does not have user relation, score, or correct_answers fields
    const participants = await this.prisma.roomParticipant.findMany({
      where: { room_id: roomId },
    });
    return participants.map((p, index) => ({
      userId: p.user_id,
      // username: null, // Not available
      // score: null, // Not available
      // correctAnswers: null, // Not available
      rank: index + 1,
    }));
  }

  async endGame(roomId: string, userId: string): Promise<void> {
    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) throw new NotFoundException('Room not found');
    if (room.owner_id !== userId) {
      throw new ForbiddenException('Only room owner can end the game');
    }
    await this.prisma.quizRoom.update({
      where: { id: roomId },
      data: { status: 'CLOSED' },
    });
  }

  async persistFinalLeaderboard(
    roomId: string,
    leaderboard: unknown[],
  ): Promise<void> {
    const room = await this.prisma.quizRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
    const settings =
      room.settings &&
      typeof room.settings === 'object' &&
      !Array.isArray(room.settings)
        ? (room.settings as Record<string, unknown>)
        : {};
    await this.prisma.quizRoom.update({
      where: { id: roomId },
      data: {
        settings: {
          ...settings,
          finalLeaderboard: leaderboard,
          gameFinishedAt: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    });
  }

  async persistGameSnapshot(
    roomId: string,
    snapshot: Record<string, unknown>,
  ): Promise<void> {
    const room = await this.prisma.quizRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
    const settings =
      room.settings &&
      typeof room.settings === 'object' &&
      !Array.isArray(room.settings)
        ? (room.settings as Record<string, unknown>)
        : {};
    await this.prisma.quizRoom.update({
      where: { id: roomId },
      data: {
        settings: {
          ...settings,
          gameSnapshot: snapshot,
        } as Prisma.InputJsonValue,
      },
    });
  }
}

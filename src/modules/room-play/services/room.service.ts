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

    await this.eventRepository.emit('RoomCreated', {
      id: created.id,
      ownerId: userId,
    } as any);

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
    console.log(`🔍 getRoom called with id: ${id}`);
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
    } as any);
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
    } as any);
    return 'Room deleted successfully';
  }

  async joinRoom(
    userId: string,
    roomId: string,
    dto: JoinRoomDto,
  ): Promise<{ room_id: string; room_code: string; socket_room: string }> {
    // Validate UUID format
    console.log(`🔍 joinRoom called with userId: ${userId}, roomId: ${roomId}`);

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
    console.log(`🔍 getParticipants called with roomId: ${roomId}`);
    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) throw new NotFoundException('Room not found');

    const rows = await this.roomRepository.findParticipants(roomId);
    console.log(`📥 DB participants rows length: ${rows.length}`);

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
        avatar_url: (u as any)?.avatar ?? null,
      };
    });
    console.log(`👥 Participants length: ${participants.length}`);

    const socketRoom = `room:${roomId}`;
    const live_sockets =
      await this.eventRepository.listSocketsInRoom(socketRoom);
    console.log(
      `🔌 Live sockets in ${socketRoom}: ${Array.isArray(live_sockets) ? live_sockets.length : 0}`,
    );

    const result = { room_id: roomId, participants, live_sockets };
    console.log(`✅ getParticipants result:`, result);
    return result;
  }

  async joinRoomViaWebSocket(
    userId: string,
    roomId: string,
  ): Promise<{ room_id: string; room_code: string; socket_room: string }> {
    console.log(
      `🔍 joinRoomViaWebSocket called with userId: ${userId}, roomId: ${roomId}`,
    );

    // Validate UUID format
    if (!this.isValidUUID(roomId)) {
      console.log(`❌ Invalid room ID format: ${roomId}`);
      throw new BadRequestException('Invalid room ID format');
    }

    if (!this.isValidUUID(userId)) {
      console.log(`❌ Invalid user ID format: ${userId}`);
      throw new BadRequestException('Invalid user ID format');
    }

    console.log(`✅ UUID validation passed for both IDs`);

    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) {
      console.log(`❌ Room not found: ${roomId}`);
      throw new NotFoundException('Room not found');
    }

    console.log(
      `✅ Room found: ${room.room_code}, current participants: ${room.current_participants}, max: ${room.max_participants}`,
    );

    if (room.current_participants >= room.max_participants) {
      console.log(
        `❌ Room is full: ${room.current_participants}/${room.max_participants}`,
      );
      throw new ForbiddenException('Room full');
    }

    console.log(`🔄 Starting database transaction...`);

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

    console.log(`✅ Database transaction completed successfully`);

    // Tell client which socket room to join
    const socketRoom = `room:${roomId}`;
    // Auto-join caller's active sockets to this room
    await this.eventRepository.joinUserToRoom(userId, socketRoom);
    await this.eventRepository.emit('Notification', {
      userId,
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

    // Update participant status and decrement count
    await this.prisma.$transaction([
      this.prisma.roomParticipant.updateMany({
        where: { room_id: roomId, user_id: userId },
        data: { status: 'LEFT', left_at: new Date() },
      }),
      this.prisma.quizRoom.update({
        where: { id: roomId },
        data: { current_participants: { decrement: 1 } },
      }),
    ]);

    await this.eventRepository.emit('Notification', {
      userId,
      message: `Left room ${room.room_code}`,
    });

    // No broadcast here in the original behavior
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
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
    // Update room status (no started_at field in schema)
    await this.prisma.quizRoom.update({
      where: { id: roomId },
      data: { status: 'IN_GAME' },
    });
  }

  async getNextQuestion(
    roomId: string,
    currentQuestionNumber: number,
  ): Promise<any> {
    const room = await this.roomRepository.findUnique({ id: roomId });
    if (!room) throw new NotFoundException('Room not found');

    // Get quiz questions
    const quiz = await this.quizRepository.findUnique({
      id: room.quiz_id,
      include: { questions: true },
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
    answer: string, // eslint-disable-line @typescript-eslint/no-unused-vars
    timeSpent: number, // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Promise<{ isCorrect: boolean; correctAnswer: string; points: number }> {
    // Verify room and participant
    const participant = await this.prisma.roomParticipant.findFirst({
      where: { room_id: roomId, user_id: userId, status: 'ACTIVE' },
    });
    if (!participant) {
      throw new ForbiddenException('Not an active participant');
    }

    // Get question
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });
    if (!question) throw new NotFoundException('Question not found');

    // No correct_answer field in schema, so always return false
    // You may want to fetch correct answer from QuestionOption model
    return {
      isCorrect: false,
      correctAnswer: '',
      points: 0,
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
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth, Authenticated } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';
import { RoomService } from '../services/room.service';
import { CreateRoomDto } from '../dtos/create-room.dto';
import { UpdateRoomDto } from '../dtos/update-room.dto';
import { RoomPaginationDto } from '../dtos/room-pagination.dto';
import { JoinRoomDto } from '../dtos/join-room.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
@Controller('/api/rooms')
export class RoomController {
  constructor(private readonly roomService: RoomService) {}

  @ApiOperation({ summary: 'Create a quiz room; owner is the creator' })
  @ApiResponse({ status: 201, description: 'Room created' })
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  @Post()
  createRoom(@Auth() auth: AuthDto, @Body() dto: CreateRoomDto) {
    return this.roomService.createRoom(auth.user.id, dto);
  }

  @ApiOperation({ summary: 'List rooms with pagination' })
  @Get()
  listRooms(@Query() pagination: RoomPaginationDto) {
    return this.roomService.listRooms(pagination);
  }

  @ApiOperation({
    summary: 'List rooms by quiz ID with pagination and filtering',
    description:
      'Get rooms for a specific quiz by ID with optional status and room_code filtering. Use ?status=OPEN to get only open rooms.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of rooms for the quiz with pagination metadata',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/QuizRoom' },
        },
        page: { type: 'number' },
        limit: { type: 'number' },
        total: { type: 'number' },
      },
    },
  })
  @Get('quiz/id/:quizId')
  async listRoomsByQuizId(
    @Param('quizId') quizId: string,
    @Query() pagination: RoomPaginationDto,
  ) {
    try {
      console.log(
        `🔍 RoomController: Fetching rooms for quizId: ${quizId}, status: ${pagination.status}`,
      );

      // Validate quizId
      if (!quizId || quizId.trim() === '') {
        throw new Error('Quiz ID is required');
      }

      const result = await this.roomService.listRoomsByQuizId(
        quizId,
        pagination,
      );
      console.log(
        `✅ RoomController: Found ${result.items?.length || 0} rooms for quizId: ${quizId}`,
      );

      return result;
    } catch (error) {
      console.error(
        `❌ RoomController: Error fetching rooms for quizId ${quizId}:`,
        error,
      );

      // Return a proper error response
      return {
        success: false,
        statusCode: 500,
        message: error.message || 'Failed to fetch rooms',
        data: [],
        page: 1,
        limit: 10,
        total: 0,
      };
    }
  }

  @ApiOperation({
    summary: 'List rooms by quiz slug with pagination and filtering',
    description:
      'Get rooms for a specific quiz by slug with optional status and room_code filtering. Use ?status=OPEN to get only open rooms.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of rooms for the quiz with pagination metadata',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/QuizRoom' },
        },
        page: { type: 'number' },
        limit: { type: 'number' },
        total: { type: 'number' },
      },
    },
  })
  @Get('quiz/slug/:quizSlug')
  listRoomsByQuizSlug(
    @Param('quizSlug') quizSlug: string,
    @Query() pagination: RoomPaginationDto,
  ) {
    return this.roomService.listRoomsByQuizSlug(quizSlug, pagination);
  }

  @ApiOperation({ summary: 'Get a room by id' })
  @Get(':id')
  getRoom(@Param('id') id: string) {
    return this.roomService.getRoom(id);
  }

  @ApiOperation({ summary: 'Get a room by code' })
  @Get('code/:roomCode')
  getRoomByCode(@Param('roomCode') roomCode: string) {
    return this.roomService.getRoomByCode(roomCode);
  }

  @ApiOperation({ summary: 'Update a room (owner only)' })
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  @Patch(':id')
  updateRoom(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Body() dto: UpdateRoomDto,
  ) {
    return this.roomService.updateRoom(auth.user.id, id, dto);
  }

  @ApiOperation({ summary: 'Delete a room (owner only)' })
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  @Delete(':id')
  deleteRoom(@Auth() auth: AuthDto, @Param('id') id: string) {
    return this.roomService.deleteRoom(auth.user.id, id);
  }

  @ApiOperation({ summary: 'Join a room by id' })
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  @Post(':id/join')
  joinRoom(
    @Auth() auth: AuthDto,
    @Param('id') id: string,
    @Body() dto: JoinRoomDto,
  ) {
    return this.roomService.joinRoom(auth.user.id, id, dto);
  }

  @ApiOperation({ summary: 'List participants of a room' })
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    return this.roomService.getParticipants(id);
  }
}

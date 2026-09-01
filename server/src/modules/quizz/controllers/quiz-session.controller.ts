import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Query,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { QuizSessionService } from '../services/quiz-session.service';
import { CreateQuizSessionDto } from '../dtos/create-quiz-session.dto';
import { SubmitQuizAnswerDto } from '../dtos/submit-quiz-answer.dto';
import { AuthGuard, Auth, Authenticated } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';
import { AiIdempotencyInterceptor } from '@/common/interceptors/ai-idempotency.interceptor';

@ApiTags('quiz-sessions')
@Controller('/api/quiz-sessions')
@UseInterceptors(AiIdempotencyInterceptor)
export class QuizSessionController {
  constructor(private readonly quizSessionService: QuizSessionService) {}

  // ==========================================
  // STATIC ROUTES (must be defined BEFORE dynamic routes)
  // ==========================================

  @Get('user/history')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Get user quiz history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserHistory(
    @Auth() auth: AuthDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.quizSessionService.getUserQuizHistory(
      auth.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('user/in-progress')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Get user in-progress quizzes' })
  async getUserInProgress(@Auth() auth: AuthDto) {
    return this.quizSessionService.getUserInProgressQuizzes(auth.user.id);
  }

  @Get('user/all-attempts')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({
    summary: 'Get all user quiz attempts (both in-progress and completed)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getAllUserAttempts(
    @Auth() auth: AuthDto,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.quizSessionService.getAllUserAttempts(
      auth.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Post()
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Start a quiz session' })
  async startSession(@Auth() auth: AuthDto, @Body() dto: CreateQuizSessionDto) {
    return this.quizSessionService.startSession(auth.user.id, dto);
  }

  @Post('public')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Start a public quiz session' })
  async startPublicSession(
    @Body() dto: CreateQuizSessionDto,
    @Auth() auth: AuthDto,
  ) {
    return this.quizSessionService.startSession(auth.user.id, dto);
  }

  @Post('public/slug')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Start a public quiz session by slug' })
  async startPublicSessionBySlug(
    @Body() dto: CreateQuizSessionDto,
    @Auth() auth: AuthDto,
  ) {
    return this.quizSessionService.startSession(auth.user.id, dto);
  }

  // ==========================================
  // DYNAMIC ROUTES (with :sessionId parameter)
  // ==========================================

  @Post(':sessionId/answers')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Submit answer' })
  async submitAnswer(
    @Param('sessionId') sessionId: string,
    @Body() body: SubmitQuizAnswerDto,
    @Auth() auth: AuthDto,
  ) {
    return this.quizSessionService.submitAnswer(
      sessionId,
      body,
      auth.user.id,
      auth.user.isAdmin,
    );
  }

  @Post(':sessionId/complete')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Complete session' })
  async completeSession(
    @Param('sessionId') sessionId: string,
    @Auth() auth: AuthDto,
  ) {
    return this.quizSessionService.completeSession(
      sessionId,
      auth.user.id,
      auth.user.isAdmin,
    );
  }

  @Post(':sessionId/answers/public')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Submit answer (public)' })
  async submitAnswerPublic(
    @Param('sessionId') sessionId: string,
    @Body() body: SubmitQuizAnswerDto,
    @Auth() auth: AuthDto,
  ) {
    return this.quizSessionService.submitAnswer(
      sessionId,
      body,
      auth.user.id,
      auth.user.isAdmin,
    );
  }

  @Post(':sessionId/complete/public')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Complete session (public)' })
  async completeSessionPublic(
    @Param('sessionId') sessionId: string,
    @Auth() auth: AuthDto,
  ) {
    return this.quizSessionService.completeSession(
      sessionId,
      auth.user.id,
      auth.user.isAdmin,
    );
  }

  @Get(':sessionId/result')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Get session result' })
  async getResult(
    @Param('sessionId') sessionId: string,
    @Auth() auth: AuthDto,
  ) {
    return this.quizSessionService.getSessionResult(
      sessionId,
      auth.user.id,
      auth.user.isAdmin,
    );
  }

  @Delete(':sessionId')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiOperation({ summary: 'Delete quiz session/attempt' })
  async deleteSession(
    @Param('sessionId') sessionId: string,
    @Auth() auth: AuthDto,
  ) {
    return this.quizSessionService.deleteAttempt(auth.user.id, sessionId);
  }
}

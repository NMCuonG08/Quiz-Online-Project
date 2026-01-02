import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { QuizSessionService } from '../services/quiz-session.service';
import { CreateQuizSessionDto } from '../dtos/create-quiz-session.dto';
import { AuthGuard, Auth, Authenticated } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';

@ApiTags('quiz-sessions')
@Controller('/api/quiz-sessions')
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
  @ApiOperation({ summary: 'Get all user quiz attempts (both in-progress and completed)' })
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
  @ApiOperation({ summary: 'Start a quiz session' })
  async startSession(@Auth() auth: AuthDto, @Body() dto: CreateQuizSessionDto) {
    return this.quizSessionService.startSession(auth.user.id, dto);
  }

  @Post('public')
  @ApiOperation({ summary: 'Start a public quiz session' })
  async startPublicSession(@Body() dto: CreateQuizSessionDto, @Req() req: any) {
    // Try to extract user ID from JWT token if present
    const userId = this.extractUserIdFromRequest(req);
    return this.quizSessionService.startSession(userId, dto);
  }

  @Post('public/slug')
  @ApiOperation({ summary: 'Start a public quiz session by slug' })
  async startPublicSessionBySlug(@Body() dto: CreateQuizSessionDto, @Req() req: any) {
    // Try to extract user ID from JWT token if present
    const userId = this.extractUserIdFromRequest(req);
    return this.quizSessionService.startSession(userId, dto);
  }

  /**
   * Helper to extract user ID from Authorization header without requiring auth
   */
  private extractUserIdFromRequest(req: any): string | undefined {
    try {
      const authHeader = req.headers?.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return req.user?.user?.id;
      }
      const token = authHeader.substring(7);
      // Decode JWT payload without verification (user validation happens in service)
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      return payload.sub || payload.userId || payload.id;
    } catch {
      return req.user?.user?.id;
    }
  }

  // ==========================================
  // DYNAMIC ROUTES (with :sessionId parameter)
  // ==========================================

  @Post(':sessionId/answers/public')
  @ApiOperation({ summary: 'Submit answer (public)' })
  async submitAnswerPublic(@Param('sessionId') sessionId: string, @Body() body: any) {
    return this.quizSessionService.submitAnswer(sessionId, body);
  }

  @Post(':sessionId/complete/public')
  @ApiOperation({ summary: 'Complete session (public)' })
  async completeSessionPublic(@Param('sessionId') sessionId: string) {
    return this.quizSessionService.completeSession(sessionId);
  }

  @Get(':sessionId/result')
  @ApiOperation({ summary: 'Get session result' })
  async getResult(@Param('sessionId') sessionId: string) {
    return this.quizSessionService.getSessionResult(sessionId);
  }
}

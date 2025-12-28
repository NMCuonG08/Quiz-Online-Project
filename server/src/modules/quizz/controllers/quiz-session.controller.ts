import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { QuizSessionService } from '../services/quiz-session.service';
import { CreateQuizSessionDto } from '../dtos/create-quiz-session.dto';
import { AuthGuard, Auth } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';

@ApiTags('quiz-sessions')
@Controller('/api/quiz-sessions')
export class QuizSessionController {
  constructor(private readonly quizSessionService: QuizSessionService) {}

  @Post()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Start a quiz session' })
  async startSession(@Auth() auth: AuthDto, @Body() dto: CreateQuizSessionDto) {
    return this.quizSessionService.startSession(auth.user.id, dto);
  }

  @Post('public')
  @ApiOperation({ summary: 'Start a public quiz session' })
  async startPublicSession(@Body() dto: CreateQuizSessionDto, @Req() req: any) {
    const userId = req.user?.user?.id;
    return this.quizSessionService.startSession(userId, dto);
  }

  @Post('public/slug')
  @ApiOperation({ summary: 'Start a public quiz session by slug' })
  async startPublicSessionBySlug(@Body() dto: CreateQuizSessionDto, @Req() req: any) {
    const userId = req.user?.user?.id;
    return this.quizSessionService.startSession(userId, dto);
  }

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

import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
import { CreateQuizSessionDto } from '../dtos/create-quiz-session.dto';
import { QuizRepository } from '../repositories/quiz.repository';
import { QuestionRepository } from '@/modules/questions/repositories/question.repository';
import { QuestionOptionRepository } from '@/modules/questions/repositories/question-option.repository';
import { RoomRepository } from '@/modules/room-play/repositories/room.repository';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { NotificationRepository } from '@/modules/notification/repositories/notification.repository';
import { EventRepository } from '@/common/repositories/event.repository';
import { EmailRepository } from '@/common/repositories/email.repository';
import { AuthCacheService } from '@/modules/auth/services/auth-cache.service';
import { RedisService } from '@/infrastructure/cache/redis/redis.service';
import { JobRepository } from '@/common/repositories/job.repository';
import { CloudinaryService } from '@/infrastructure/storage/cloudinary/cloudinary.service';
import { CategoryRepository } from '@/modules/category/repositories/category.repository';
import { CryptoRepository } from '@/common/repositories/crypto.repository';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { LoggingRepository } from '@/common/repositories/logging.repository';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class QuizSessionService extends BaseService {
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly configService: ConfigService,
    protected readonly logger: LoggingRepository,
    protected readonly userRepository: UserRepository,
    protected readonly quizRepository: QuizRepository,
    protected readonly cryptoRepository: CryptoRepository,
    protected readonly categoryRepository: CategoryRepository,
    protected readonly cloudinaryService: CloudinaryService,
    protected readonly jobRepository: JobRepository,
    protected readonly redisService: RedisService,
    protected readonly authCacheService: AuthCacheService,
    protected readonly emailRepository: EmailRepository,
    protected readonly eventRepository: EventRepository,
    protected readonly notificationRepository: NotificationRepository,
    protected readonly roomRepository: RoomRepository,
    protected readonly prisma: PrismaService,
    protected readonly questionRepository: QuestionRepository,
    protected readonly questionOptionRepository: QuestionOptionRepository,
  ) {
    super(
      jwtService,
      configService,
      logger,
      userRepository,
      quizRepository,
      cryptoRepository,
      categoryRepository,
      cloudinaryService,
      jobRepository,
      redisService,
      authCacheService,
      emailRepository,
      eventRepository,
      notificationRepository,
      roomRepository,
      prisma,
      questionRepository,
      questionOptionRepository,
    );
  }

  async startSession(userId: string | undefined, dto: CreateQuizSessionDto) {
    let targetUserId = userId;

    // Fallback: If no userId (public session), use the first user in the DB
    if (!targetUserId) {
      const user = await this.prisma.user.findFirst({ select: { id: true } });
      if (!user) {
        throw new NotFoundException('No users found in system to assign session');
      }
      targetUserId = user.id;
    }

    let quizId = dto.quiz_id;

    if (!quizId && dto.quiz_slug) {
      const quiz = await this.quizRepository.findBySlug(dto.quiz_slug);
      if (!quiz) {
        throw new NotFoundException('Quiz not found');
      }
      quizId = quiz.id;
    }

    if (!quizId) {
      throw new NotFoundException('Quiz identifier missing');
    }

    // Determine next attempt number
    const lastAttempt = await this.prisma.quizAttempt.findFirst({
      where: { quiz_id: quizId, user_id: targetUserId },
      orderBy: { attempt_number: 'desc' },
      select: { attempt_number: true },
    });
    const nextAttemptNumber = (lastAttempt?.attempt_number || 0) + 1;

    // Create session (QuizAttempt)
    const attempt = await this.prisma.quizAttempt.create({
      data: {
        quiz_id: quizId,
        user_id: targetUserId,
        attempt_number: nextAttemptNumber,
        status: 'IN_PROGRESS',
        started_at: new Date(),
      },
      include: {
        quiz: {
          include: {
            _count: {
              select: { questions: true },
            },
          },
        },
      },
    });

    return {
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      user_id: attempt.user_id,
      started_at: attempt.started_at.toISOString(),
      current_question_index: 0,
      total_questions: attempt.quiz?._count?.questions || 0,
      score: 0,
      time_spent: 0,
      answers: [],
    };
  }

  async submitAnswer(sessionId: string, answerDto: any) {
    // Basic implementation to satisfy the frontend call
    return await this.prisma.questionResponse.create({
      data: {
        attempt_id: sessionId,
        question_id: answerDto.question_id,
        selected_options: answerDto.selected_option_id ? [answerDto.selected_option_id] : [],
        text_answer: answerDto.text_answer,
        time_taken: answerDto.time_spent,
      },
    });
  }

  async completeSession(sessionId: string) {
    return await this.prisma.quizAttempt.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
      },
    });
  }

  async getSessionResult(sessionId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            _count: { select: { questions: true } }
          }
        },
        responses: true,
      },
    });

    if (!attempt) throw new NotFoundException('Session not found');

    const totalQuestions = attempt.quiz?._count?.questions || 0;
    const correctAnswers = attempt.responses.filter(r => r.is_correct).length;

    return {
      session_id: attempt.id,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      total_score: attempt.score,
      percentage: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
      time_spent: attempt.time_taken || 0,
      passed: attempt.passed,
    };
  }
}

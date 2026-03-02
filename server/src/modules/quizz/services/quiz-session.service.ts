import { Injectable, NotFoundException } from '@nestjs/common';
import { AttemptStatus } from '@prisma/client';
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
    console.log('🚀 startSession called with:', { userId, dto });

    // Fallback: If no userId (public session), use the first user in the DB
    if (!targetUserId) {
      const user = await this.prisma.user.findFirst({ select: { id: true } });
      if (!user) {
        throw new NotFoundException(
          'No users found in system to assign session',
        );
      }
      targetUserId = user.id;
      console.log(
        '⚠️ No userId provided, falling back to system user:',
        targetUserId,
      );
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

    console.log('🔍 Checking for existing attempt:', { quizId, targetUserId });

    // Check for existing IN_PROGRESS attempt
    const existingAttempt = await this.prisma.quizAttempt.findFirst({
      where: {
        quiz_id: quizId,
        user_id: targetUserId,
        status: 'IN_PROGRESS' as AttemptStatus,
      },
      include: {
        quiz: {
          include: {
            _count: {
              select: { questions: true },
            },
          },
        },
        responses: true,
      },
    });

    if (existingAttempt) {
      console.log('✅ [Service] Found existing attempt:', existingAttempt.id);
      // Resume existing session
      return {
        id: existingAttempt.id,
        quiz_id: existingAttempt.quiz_id,
        user_id: existingAttempt.user_id,
        started_at: existingAttempt.started_at.toISOString(),
        current_question_index: existingAttempt.responses.length, // Rough estimate, frontend handles actual navigation
        total_questions: existingAttempt.quiz?._count?.questions || 0,
        score: existingAttempt.score,
        time_spent: existingAttempt.time_taken || 0,
        answers: existingAttempt.responses.map((r) => ({
          question_id: r.question_id,
          selected_option_id: r.selected_options[0] || undefined,
          text_answer: r.text_answer,
        })),
        is_resume: true,
      };
    }

    console.log('⚠️ No existing attempt found, creating new one.');

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
      is_resume: false,
    };
  }

  async submitAnswer(sessionId: string, answerDto: any) {
    // Get the question to check correct answer
    const question = await this.prisma.question.findUnique({
      where: { id: answerDto.question_id },
      include: {
        options: {
          where: { is_correct: true },
          select: { id: true },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check if the selected option is correct
    const correctOptionIds = question.options.map((opt) => opt.id);
    const selectedOptionId = answerDto.selected_option_id;
    const isCorrect = selectedOptionId
      ? correctOptionIds.includes(selectedOptionId)
      : false;

    // Calculate points earned
    const pointsEarned = isCorrect ? question.points : 0;

    // Check if answer already exists (upsert)
    const existingResponse = await this.prisma.questionResponse.findUnique({
      where: {
        attempt_id_question_id: {
          attempt_id: sessionId,
          question_id: answerDto.question_id,
        },
      },
    });

    if (existingResponse) {
      // Update existing response
      return await this.prisma.questionResponse.update({
        where: { id: existingResponse.id },
        data: {
          selected_options: selectedOptionId ? [selectedOptionId] : [],
          text_answer: answerDto.text_answer,
          is_correct: isCorrect,
          points_earned: pointsEarned,
          time_taken: answerDto.time_spent,
          answered_at: new Date(),
        },
      });
    }

    // Create new response
    return await this.prisma.questionResponse.create({
      data: {
        attempt_id: sessionId,
        question_id: answerDto.question_id,
        selected_options: selectedOptionId ? [selectedOptionId] : [],
        text_answer: answerDto.text_answer,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        time_taken: answerDto.time_spent,
      },
    });
  }

  async completeSession(sessionId: string) {
    // Get all responses to calculate total score
    const responses = await this.prisma.questionResponse.findMany({
      where: { attempt_id: sessionId },
    });

    const totalScore = responses.reduce((sum, r) => sum + r.points_earned, 0);
    const correctCount = responses.filter((r) => r.is_correct).length;

    // Get quiz info for max_score and passing_score
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            questions: { select: { points: true } },
          },
        },
      },
    });

    const maxScore =
      attempt?.quiz?.questions.reduce((sum, q) => sum + q.points, 0) || 0;
    const passingScore = attempt?.quiz?.passing_score || 70;
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    const passed = percentage >= passingScore;

    // Calculate time taken
    const startedAt = attempt?.started_at || new Date();
    const timeTaken = Math.floor(
      (new Date().getTime() - startedAt.getTime()) / 1000,
    );

    return await this.prisma.quizAttempt.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        completed_at: new Date(),
        score: totalScore,
        max_score: maxScore,
        percentage,
        passed,
        time_taken: timeTaken,
      },
    });
  }

  async getSessionResult(sessionId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: sessionId },
      include: {
        quiz: {
          include: {
            _count: { select: { questions: true } },
          },
        },
        responses: true,
      },
    });

    if (!attempt) throw new NotFoundException('Session not found');

    const totalQuestions = attempt.quiz?._count?.questions || 0;
    const correctAnswers = attempt.responses.filter((r) => r.is_correct).length;

    return {
      session_id: attempt.id,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      total_score: attempt.score,
      max_score: attempt.max_score,
      percentage: attempt.percentage,
      time_spent: attempt.time_taken || 0,
      passed: attempt.passed,
    };
  }

  /**
   * Get quiz history for a user
   */
  async getUserQuizHistory(userId: string, page = 1, limit = 10) {
    console.log('📊 getUserQuizHistory called with:', { userId, page, limit });
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.quizAttempt.findMany({
        where: {
          user_id: userId,
          status: 'COMPLETED',
        },
        include: {
          quiz: {
            include: {
              thumbnail: { select: { url: true } },
              category: { select: { name: true, slug: true } },
              _count: { select: { questions: true } },
            },
          },
          responses: {
            select: {
              is_correct: true,
            },
          },
        },
        orderBy: { completed_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quizAttempt.count({
        where: {
          user_id: userId,
          status: 'COMPLETED',
        },
      }),
    ]);

    console.log('📊 Found attempts:', { count: attempts.length, total });

    const data = attempts.map((attempt) => ({
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      quiz_title: attempt.quiz?.title || 'Unknown Quiz',
      quiz_slug: attempt.quiz?.slug || '',
      quiz_thumbnail: attempt.quiz?.thumbnail?.url || null,
      category_name: attempt.quiz?.category?.name || null,
      total_questions: attempt.quiz?._count?.questions || 0,
      correct_answers: attempt.responses.filter((r) => r.is_correct).length,
      score: attempt.score,
      max_score: attempt.max_score,
      percentage: attempt.percentage,
      passed: attempt.passed,
      time_taken: attempt.time_taken,
      completed_at: attempt.completed_at?.toISOString() || null,
      attempt_number: attempt.attempt_number,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get in-progress quizzes for a user
   */
  async getUserInProgressQuizzes(userId: string) {
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        user_id: userId,
        status: 'IN_PROGRESS',
      },
      include: {
        quiz: {
          include: {
            thumbnail: { select: { url: true } },
            _count: { select: { questions: true } },
          },
        },
        responses: true,
      },
      orderBy: { started_at: 'desc' },
      take: 5,
    });

    return attempts.map((attempt) => ({
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      quiz_title: attempt.quiz?.title || 'Unknown Quiz',
      quiz_slug: attempt.quiz?.slug || '',
      quiz_thumbnail: attempt.quiz?.thumbnail?.url || null,
      total_questions: attempt.quiz?._count?.questions || 0,
      answered_questions: attempt.responses.length,
      started_at: attempt.started_at.toISOString(),
    }));
  }

  /**
   * Get ALL quiz attempts for a user (both IN_PROGRESS and COMPLETED)
   */
  async getAllUserAttempts(userId: string, page = 1, limit = 10) {
    console.log('📊 getAllUserAttempts called with:', { userId, page, limit });
    const skip = (page - 1) * limit;

    const [attempts, total] = await Promise.all([
      this.prisma.quizAttempt.findMany({
        where: {
          user_id: userId,
        },
        include: {
          quiz: {
            include: {
              thumbnail: { select: { url: true } },
              category: { select: { name: true, slug: true } },
              _count: { select: { questions: true } },
            },
          },
          responses: {
            select: {
              is_correct: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.quizAttempt.count({
        where: {
          user_id: userId,
        },
      }),
    ]);

    console.log('📊 Found ALL attempts:', { count: attempts.length, total });

    const data = attempts.map((attempt) => ({
      id: attempt.id,
      quiz_id: attempt.quiz_id,
      quiz_title: attempt.quiz?.title || 'Unknown Quiz',
      quiz_slug: attempt.quiz?.slug || '',
      quiz_thumbnail: attempt.quiz?.thumbnail?.url || null,
      category_name: attempt.quiz?.category?.name || null,
      total_questions: attempt.quiz?._count?.questions || 0,
      answered_questions: attempt.responses.length,
      correct_answers: attempt.responses.filter((r) => r.is_correct).length,
      score: attempt.score,
      max_score: attempt.max_score,
      percentage: attempt.percentage,
      passed: attempt.passed,
      status: attempt.status,
      time_taken: attempt.time_taken,
      started_at: attempt.started_at.toISOString(),
      completed_at: attempt.completed_at?.toISOString() || null,
      attempt_number: attempt.attempt_number,
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteAttempt(userId: string, attemptId: string) {
    const attempt = await this.prisma.quizAttempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.user_id !== userId) {
      throw new NotFoundException('Attempt not found'); // Hide existence if not owner
    }

    await this.prisma.quizAttempt.delete({
      where: { id: attemptId },
    });

    return { success: true, message: 'Attempt deleted successfully' };
  }
}

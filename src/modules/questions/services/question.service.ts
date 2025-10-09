import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
import { BaseRepository } from '@/common/base/base.repository';
import { CreateQuestionDto } from '../dtos/create-question.dto';
import { UpdateQuestionDto } from '../dtos/update-question.dto';
import { PaginatedResponseDto } from '@/common/dtos/responses/base.response';
import { QuestionPaginationQueryDto } from '../dtos/question-pagination.dto';
import { QuestionResponseDto } from '../dtos/question-response.dto';
import {
  QuestionTypeEnum,
  DifficultyLevelEnum,
  MediaTypeEnum,
} from '@/common/enums';
import { QuestionRepository } from '../repositories/question.repository';
import { QuestionOptionRepository } from '../repositories/question-option.repository';
import { QuizRepository } from '@/modules/quizz/repositories/quiz.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggingRepository } from '@/common/repositories/logging.repository';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { CryptoRepository } from '@/common/repositories/crypto.repository';
import { CategoryRepository } from '@/modules/category/repositories/category.repository';
import { CloudinaryService } from '@/infrastructure/storage/cloudinary/cloudinary.service';
import { JobRepository } from '@/common/repositories/job.repository';
import { RedisService } from '@/infrastructure/cache/redis/redis.service';
import { AuthCacheService } from '@/modules/auth/services/auth-cache.service';
import { EmailRepository } from '@/common/repositories/email.repository';
import { EventRepository } from '@/common/repositories/event.repository';
import { NotificationRepository } from '@/modules/notification/repositories/notification.repository';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class QuestionService extends BaseService {
  constructor(
    jwtService: JwtService,
    configService: ConfigService,
    logger: LoggingRepository,
    userRepository: UserRepository,
    quizRepository: QuizRepository,
    cryptoRepository: CryptoRepository,
    categoryRepository: CategoryRepository,
    cloudinaryService: CloudinaryService,
    jobRepository: JobRepository,
    redisService: RedisService,
    authCacheService: AuthCacheService,
    emailRepository: EmailRepository,
    eventRepository: EventRepository,
    notificationRepository: NotificationRepository,
    prisma: PrismaService,
    questionRepository: QuestionRepository,
    questionOptionRepository: QuestionOptionRepository,
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
      prisma,
      questionRepository,
      questionOptionRepository,
    );
  }
  async getQuestions(
    paginationQuery: QuestionPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuestionResponseDto>> {
    const where: Record<string, any> = {};

    // Apply filters
    if (paginationQuery.quiz_id) {
      where.quiz_id = paginationQuery.quiz_id;
    }
    if (paginationQuery.question_type) {
      where.question_type = paginationQuery.question_type;
    }
    if (paginationQuery.difficulty_level) {
      where.difficulty_level = paginationQuery.difficulty_level;
    }

    const result = await this.questionRepository.paginateWithRelations(
      paginationQuery,
      where,
    );
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getQuestionsByQuiz(
    quizId: string,
    paginationQuery: QuestionPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuestionResponseDto>> {
    // Verify quiz exists
    const quiz = await this.quizRepository.findByIdRaw(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const result = await this.questionRepository.paginateWithRelations(
      paginationQuery,
      { quiz_id: quizId },
    );
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getQuestionById(id: string): Promise<QuestionResponseDto> {
    const result = await this.questionRepository.findById(id);
    if (!result) {
      throw new NotFoundException('Question not found');
    }
    return result;
  }

  async getQuestionBySlug(slug: string): Promise<QuestionResponseDto> {
    const result = await this.questionRepository.findBySlug(slug);
    if (!result) {
      throw new NotFoundException('Question not found');
    }
    return result;
  }

  async createQuestion(
    question: CreateQuestionDto,
    media?: Express.Multer.File,
  ): Promise<QuestionResponseDto> {
    // Verify quiz exists
    const quiz = await this.quizRepository.findByIdRaw(question.quiz_id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Check slug availability if provided
    if (question.slug) {
      const isSlugAvailable = await this.questionRepository.isSlugAvailable(
        question.slug,
      );
      if (!isSlugAvailable) {
        throw new BadRequestException('Slug already exists');
      }
    }

    // Handle media upload if provided
    let mediaId: string | undefined;
    if (media) {
      const uploadResult = await this.cloudinaryService.uploadImage(media);
      mediaId = uploadResult?.id;
    }

    // Prepare question data
    const { options, ...questionWithoutOptions } = question;
    const questionData = {
      ...questionWithoutOptions,
      media_id: mediaId || null,
    };

    // Create question with options
    return await this.questionRepository.createWithOptions(
      questionData,
      options,
    );
  }

  async updateQuestion(
    id: string,
    updateData: UpdateQuestionDto,
    media?: Express.Multer.File,
  ): Promise<QuestionResponseDto> {
    const existingQuestion = await this.questionRepository.findByIdRaw(id);
    if (!existingQuestion) {
      throw new NotFoundException('Question not found');
    }

    // Check slug availability if slug is being updated
    if (updateData.slug) {
      const isSlugAvailable = await this.questionRepository.isSlugAvailable(
        updateData.slug,
        id,
      );
      if (!isSlugAvailable) {
        throw new BadRequestException('Slug already exists');
      }
    }

    // Handle media upload if provided
    let mediaId: string | undefined;
    if (media) {
      const uploadResult = await this.cloudinaryService.uploadImage(media);
      mediaId = uploadResult?.id;
    }

    // Prepare update data
    const { options, ...questionWithoutOptions } = updateData;
    const dataToUpdate: Record<string, any> = {
      ...questionWithoutOptions,
      ...(mediaId ? { media_id: mediaId } : {}),
    };

    // Update question with options
    return await this.questionRepository.updateQuestion(
      id,
      dataToUpdate,
      options,
    );
  }

  async deleteQuestion(id: string): Promise<void> {
    const existingQuestion = await this.questionRepository.findByIdRaw(id);
    if (!existingQuestion) {
      throw new NotFoundException('Question not found');
    }

    await this.questionRepository.deleteQuestion(id);
  }

  async getQuestionsByQuizId(quizId: string): Promise<QuestionResponseDto[]> {
    // Verify quiz exists
    const quiz = await this.quizRepository.findByIdRaw(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return await this.questionRepository.getQuestionsByQuiz(quizId);
  }

  async reorderQuestions(
    quizId: string,
    questionOrders: { id: string; sort_order: number }[],
  ): Promise<void> {
    // Verify quiz exists
    const quiz = await this.quizRepository.findByIdRaw(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Update sort orders in a transaction
    await this.prisma.$transaction(
      questionOrders.map(({ id, sort_order }) =>
        this.prisma.question.update({
          where: { id },
          data: { sort_order },
        }),
      ),
    );
  }

  async duplicateQuestion(
    id: string,
    newQuizId?: string,
  ): Promise<QuestionResponseDto> {
    const existingQuestion = await this.questionRepository.findById(id);
    if (!existingQuestion) {
      throw new NotFoundException('Question not found');
    }

    // If newQuizId is provided, verify it exists
    if (newQuizId) {
      const quiz = await this.quizRepository.findByIdRaw(newQuizId);
      if (!quiz) {
        throw new NotFoundException('Target quiz not found');
      }
    }

    // Prepare duplicate data
    const duplicateData: CreateQuestionDto = {
      quiz_id: newQuizId || existingQuestion.quiz_id,
      question_text: `${existingQuestion.question_text} (Copy)`,
      slug: existingQuestion.slug ? `${existingQuestion.slug}-copy` : undefined,
      question_type: existingQuestion.question_type as QuestionTypeEnum,
      points: existingQuestion.points,
      time_limit: existingQuestion.time_limit,
      explanation: existingQuestion.explanation,
      media_id: existingQuestion.media_id,
      media_type: existingQuestion.media_type as MediaTypeEnum,
      difficulty_level:
        existingQuestion.difficulty_level as DifficultyLevelEnum,
      sort_order: existingQuestion.sort_order + 1,
      is_required: existingQuestion.is_required,
      settings: existingQuestion.settings,
      options: existingQuestion.options?.map((option) => ({
        option_text: option.option_text,
        is_correct: option.is_correct,
        sort_order: option.sort_order,
        explanation: option.explanation,
        media_url: option.media_url,
      })),
    };

    return await this.createQuestion(duplicateData);
  }
}

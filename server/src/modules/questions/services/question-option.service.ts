import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
import { BaseRepository } from '@/common/base/base.repository';
import { CreateQuestionOptionDto } from '../dtos/create-question-option.dto';
import { UpdateQuestionOptionDto } from '../dtos/update-question-option.dto';
import { PaginatedResponseDto } from '@/common/dtos/responses/base.response';
import { QuestionOptionPaginationQueryDto } from '../dtos/question-option-pagination.dto';
import { QuestionOptionResponseDto } from '../dtos/question-option-response.dto';
import { QuestionRepository } from '../repositories/question.repository';
import { QuestionOptionRepository } from '../repositories/question-option.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggingRepository } from '@/common/repositories/logging.repository';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { QuizRepository } from '@/modules/quizz/repositories/quiz.repository';
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
import { RoomRepository } from '@/modules/room-play/repositories/room.repository';
import { mapQuestionOptionToResponseDto } from '../mappers/question-option-mapper';

@Injectable()
export class QuestionOptionService extends BaseService {
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
    roomRepository: RoomRepository,
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
  async getQuestionOptions(
    paginationQuery: QuestionOptionPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuestionOptionResponseDto>> {
    const where: Record<string, any> = {};

    // Apply filters
    if (paginationQuery.question_id) {
      where.question_id = paginationQuery.question_id;
    }
    if (paginationQuery.is_correct !== undefined) {
      where.is_correct = paginationQuery.is_correct;
    }

    const result = await this.questionOptionRepository.paginateWithRelations(
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

  async getQuestionOptionsByQuestion(
    questionId: string,
    paginationQuery: QuestionOptionPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuestionOptionResponseDto>> {
    // Verify question exists
    const question = await this.questionRepository.findByIdRaw(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const result = await this.questionOptionRepository.paginateWithRelations(
      paginationQuery,
      { question_id: questionId },
    );
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getQuestionOptionById(id: string): Promise<QuestionOptionResponseDto> {
    const result = await this.questionOptionRepository.findById(id);
    if (!result) {
      throw new NotFoundException('Question option not found');
    }
    return result;
  }

  async createQuestionOption(
    option: CreateQuestionOptionDto,
  ): Promise<QuestionOptionResponseDto> {
    // Verify question exists
    const question = await this.questionRepository.findById(option.question_id);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Create the option
    const createdOption = await this.prisma.questionOption.create({
      data: option,
      include: {
        question: {
          select: {
            question_text: true,
            question_type: true,
          },
        },
      },
    });

    // Map to DTO
    const dto = mapQuestionOptionToResponseDto(createdOption);
    await this.eventRepository.emit('QuestionOptionCreated', {
      id: createdOption.id,
      questionId: createdOption.question_id,
    } as any);
    return dto;
  }

  async updateQuestionOption(
    id: string,
    updateData: UpdateQuestionOptionDto,
  ): Promise<QuestionOptionResponseDto> {
    const existingOption = await this.questionOptionRepository.findByIdRaw(id);
    if (!existingOption) {
      throw new NotFoundException('Question option not found');
    }

    // Update the option
    const updated = await this.questionOptionRepository.updateOption(
      id,
      updateData,
    );
    await this.eventRepository.emit('QuestionOptionUpdated', {
      id,
      questionId: updated.question_id,
    } as any);
    return updated;
  }

  async deleteQuestionOption(id: string): Promise<void> {
    const existingOption = await this.questionOptionRepository.findByIdRaw(id);
    if (!existingOption) {
      throw new NotFoundException('Question option not found');
    }

    await this.questionOptionRepository.deleteOption(id);
    await this.eventRepository.emit('QuestionOptionDeleted', {
      id,
      questionId: existingOption.question_id,
    } as any);
  }

  async getQuestionOptionsByQuestionId(
    questionId: string,
  ): Promise<QuestionOptionResponseDto[]> {
    // Verify question exists
    const question = await this.questionRepository.findByIdRaw(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return await this.questionOptionRepository.findByQuestionId(questionId);
  }

  async getCorrectOptionsByQuestionId(
    questionId: string,
  ): Promise<QuestionOptionResponseDto[]> {
    // Verify question exists
    const question = await this.questionRepository.findByIdRaw(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    return await this.questionOptionRepository.findCorrectOptionsByQuestionId(
      questionId,
    );
  }

  async reorderQuestionOptions(
    questionId: string,
    optionOrders: { id: string; sort_order: number }[],
  ): Promise<void> {
    // Verify question exists
    const question = await this.questionRepository.findByIdRaw(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Verify all options belong to the question
    const existingOptions =
      await this.questionOptionRepository.findByQuestionId(questionId);
    const existingOptionIds = existingOptions.map((option) => option.id);

    for (const order of optionOrders) {
      if (!existingOptionIds.includes(order.id)) {
        throw new BadRequestException(
          `Option ${order.id} does not belong to question ${questionId}`,
        );
      }
    }

    await this.questionOptionRepository.reorderOptions(
      questionId,
      optionOrders,
    );
  }

  async deleteAllOptionsByQuestionId(questionId: string): Promise<void> {
    // Verify question exists
    const question = await this.questionRepository.findByIdRaw(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    await this.questionOptionRepository.deleteOptionsByQuestionId(questionId);
  }

  async getQuestionOptionStats(questionId: string) {
    // Verify question exists
    const question = await this.questionRepository.findByIdRaw(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const [totalOptions, correctOptions] = await Promise.all([
      this.questionOptionRepository.getOptionsCountByQuestionId(questionId),
      this.questionOptionRepository.getCorrectOptionsCountByQuestionId(
        questionId,
      ),
    ]);

    return {
      total_options: totalOptions,
      correct_options: correctOptions,
      incorrect_options: totalOptions - correctOptions,
    };
  }

  async bulkCreateQuestionOptions(
    questionId: string,
    options: Omit<CreateQuestionOptionDto, 'question_id'>[],
  ): Promise<QuestionOptionResponseDto[]> {
    // Verify question exists
    const question = await this.questionRepository.findByIdRaw(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Prepare options with question_id
    const optionsWithQuestionId = options.map((option) => ({
      ...option,
      question_id: questionId,
    }));

    // Create options in a transaction
    const createdOptions = await this.prisma.$transaction(
      optionsWithQuestionId.map((option) =>
        this.prisma.questionOption.create({
          data: option,
          include: {
            question: {
              select: {
                question_text: true,
                question_type: true,
              },
            },
          },
        }),
      ),
    );

    // Map to DTOs
    return createdOptions.map((option) =>
      mapQuestionOptionToResponseDto(option),
    );
  }

  async bulkUpdateQuestionOptions(
    questionId: string,
    options: { id: string; data: UpdateQuestionOptionDto }[],
  ): Promise<QuestionOptionResponseDto[]> {
    // Verify question exists
    const question = await this.questionRepository.findByIdRaw(questionId);
    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Verify all options belong to the question
    const existingOptions =
      await this.questionOptionRepository.findByQuestionId(questionId);
    const existingOptionIds = existingOptions.map((option) => option.id);

    for (const option of options) {
      if (!existingOptionIds.includes(option.id)) {
        throw new BadRequestException(
          `Option ${option.id} does not belong to question ${questionId}`,
        );
      }
    }

    // Update options in a transaction
    const updatedOptions = await this.prisma.$transaction(
      options.map(({ id, data }) =>
        this.prisma.questionOption.update({
          where: { id },
          data,
          include: {
            question: {
              select: {
                question_text: true,
                question_type: true,
              },
            },
          },
        }),
      ),
    );

    // Map to DTOs
    return updatedOptions.map((option) =>
      mapQuestionOptionToResponseDto(option),
    );
  }
}

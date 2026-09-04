import {
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';
import { BaseService } from '@/common/base/base.service';
import { CreateQuizDto } from '../dtos/create-quiz.dto';
import { CreateQuizWithQuestionsDto } from '../dtos/create-quiz-with-questions.dto';
import { parseQuestionOptions, validateQuestionOptions } from '@/modules/questions/services/question.service';
import { JobStatus, JobName, QueueName } from '@/common/enums';
import { OnJob } from '@/common/decorators';
import { PaginatedResponseDto } from '@/common/dtos/responses/base.response';
import { QuizPaginationQueryDto } from '../dtos/quiz-pagination.dto';
import { QuizResponseDto } from '../dtos/quiz-response.dto';

// Removed queue-based upload types in favor of direct Cloudinary upload

type CreateQuizWithQuestionsResult = {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  questions_created: number;
  question_ids: string[];
  partial_failure: false;
};

@Injectable()
export class QuizService extends BaseService {
  async getQuizzes(
    paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const result =
      await this.quizRepository.paginateWithRelations(paginationQuery);
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getQuizzesByCreator(
    creatorId: string,
    paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const result = await this.quizRepository.paginateWithRelations(
      paginationQuery,
      {
        creator_id: creatorId,
      },
    );
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getQuizzesByCategory(
    categoryId: string,
    paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const result = await this.quizRepository.paginateWithRelations(
      paginationQuery,
      {
        category_id: categoryId,
      },
    );
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  // Search methods by different criteria
  async getRecentlyPublishedQuizzes(
    paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const result =
      await this.quizRepository.getRecentlyPublishedQuizzes(paginationQuery);
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getBestRatedQuizzes(
    paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const result =
      await this.quizRepository.getBestRatedQuizzes(paginationQuery);
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getPopularQuizzes(
    paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const result = await this.quizRepository.getPopularQuizzes(paginationQuery);
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getEasyQuizzes(
    paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const result = await this.quizRepository.getEasyQuizzes(paginationQuery);
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getHardQuizzes(
    paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const result = await this.quizRepository.getHardQuizzes(paginationQuery);
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async searchQuizzes(
    paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const result = await this.quizRepository.searchQuizzes(paginationQuery);
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getQuizzesByDifficulty(
    difficulty: 'easy' | 'medium' | 'hard',
    paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const result = await this.quizRepository.paginateWithRelations({
      ...paginationQuery,
      difficulty,
    });
    return new PaginatedResponseDto(
      result.data,
      result.meta.page,
      result.meta.limit,
      result.meta.total,
    );
  }

  async getQuizBySlug(slug: string): Promise<QuizResponseDto> {
    const result = await this.quizRepository.findBySlug(slug);
    if (!result) {
      throw new NotFoundException('Quiz not found');
    }
    return result;
  }

  async getQuizById(id: string): Promise<QuizResponseDto> {
    const result = await this.quizRepository.findById(id);
    if (!result) {
      throw new NotFoundException('Quiz not found');
    }
    return result;
  }

  async createQuiz(
    quiz: CreateQuizDto,
    thumbnail?: Express.Multer.File,
    creatorId?: string,
  ) {
    // Check slug availability before creating
    const isSlugAvailable = await this.quizRepository.isSlugAvailable(
      quiz.slug,
    );
    if (!isSlugAvailable) {
      throw new BadRequestException('Slug already exists');
    }

    let thumbnailId: string | undefined;
    // If thumbnail file is provided, upload directly to Cloudinary first
    if (thumbnail) {
      const uploadResult = await this.cloudinaryService.uploadImage(thumbnail);
      thumbnailId = uploadResult?.id;
    } else if (quiz.thumbnail_url) {
      const uploadResult = await this.cloudinaryService.uploadImageFromUrl(
        quiz.thumbnail_url,
      );
      thumbnailId = uploadResult?.id;
    }
    const { thumbnail: _thumbnail, thumbnail_url: _thumbnailUrl, ...quizWithoutThumbnail } = quiz;
    void _thumbnail;
    void _thumbnailUrl;
    const quizData = {
      ...quizWithoutThumbnail,
      ...(creatorId ? { creator_id: creatorId } : {}),
      thumbnail_id: thumbnailId || null,
    };
    const created = await this.quizRepository.create(quizData);
    await this.eventRepository.emit('QuizCreated', { id: created.id });
    return created;
  }

  async createQuizWithQuestions(
    dto: CreateQuizWithQuestionsDto,
    creatorId: string,
    idempotencyKey?: string,
  ) {
    const key = idempotencyKey?.trim();
    if (!key || key.length > 128) {
      throw new BadRequestException(
        'Idempotency-Key is required and must be at most 128 characters',
      );
    }

    const { published_at: _publishedAt, ...hashablePayload } = dto;
    void _publishedAt;
    const requestHash = createHash('sha256')
      .update(JSON.stringify(hashablePayload))
      .digest('hex');
    const uploadedImageIds: string[] = [];
    let thumbnailId: string | undefined;
    if (dto.thumbnail_url) {
      const uploaded = await this.cloudinaryService.uploadImageFromUrl(dto.thumbnail_url);
      thumbnailId = uploaded?.id;
      if (thumbnailId) uploadedImageIds.push(thumbnailId);
    }
    const preparedQuestions = await Promise.all(dto.questions.map(async (question, index) => {
      const options = parseQuestionOptions(question.options);
      validateQuestionOptions(question.question_type, options);
      let mediaId: string | undefined;
      if (question.media_url) {
        const uploaded = await this.cloudinaryService.uploadImageFromUrl(question.media_url);
        mediaId = uploaded?.id;
        if (mediaId) uploadedImageIds.push(mediaId);
      }
      const { media_url: _mediaUrl, ...questionWithoutMediaUrl } = question;
      void _mediaUrl;
      return {
        ...questionWithoutMediaUrl,
        media_id: mediaId,
        options,
        sort_order: question.sort_order ?? index,
      };
    }));

    const run = (): Promise<CreateQuizWithQuestionsResult> => this.prisma.$transaction(async (tx) => {
      const existing = await tx.aiWriteIdempotency.findUnique({
        where: { user_id_idempotency_key: { user_id: creatorId, idempotency_key: key } },
      });
      if (existing && existing.expires_at <= new Date()) {
        await tx.aiWriteIdempotency.delete({ where: { id: existing.id } });
      } else if (existing) {
        if (existing.request_hash !== requestHash) {
          throw new ConflictException('IDEMPOTENCY_KEY_REUSED: payload khác với request trước đó');
        }
        if (existing.status === 'COMPLETED' && existing.response) {
          return existing.response as CreateQuizWithQuestionsResult;
        }
        throw new ConflictException('IDEMPOTENCY_REQUEST_IN_PROGRESS: request đang được xử lý');
      }

      const reservation = await tx.aiWriteIdempotency.create({
        data: {
          user_id: creatorId,
          idempotency_key: key,
          operation: 'create_quiz_with_questions',
          request_hash: requestHash,
          status: 'PROCESSING',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      const duplicateQuiz = await tx.quiz.findFirst({ where: { slug: dto.slug }, select: { id: true } });
      if (duplicateQuiz) throw new BadRequestException('Slug already exists');

      const quiz = await tx.quiz.create({
        data: {
          title: dto.title,
          slug: dto.slug,
          category_id: dto.category_id,
          creator_id: creatorId,
          description: dto.description || null,
          difficulty_level: dto.difficulty_level,
          time_limit: dto.time_limit,
          max_attempts: dto.max_attempts ?? 0,
          passing_score: dto.passing_score ?? 0,
          is_public: true,
          is_active: false,
          quiz_type: dto.quiz_type,
          instructions: dto.instructions || null,
          thumbnail_id: thumbnailId || null,
          published_at: null,
        },
      });
      const questionIds: string[] = [];
      for (const question of preparedQuestions) {
        if (question.slug) {
          const duplicateQuestion = await tx.question.findFirst({
            where: { slug: question.slug },
            select: { id: true },
          });
          if (duplicateQuestion) throw new BadRequestException('Question slug already exists');
        }
        const createdQuestion = await tx.question.create({
          data: {
            quiz_id: quiz.id,
            question_text: question.question_text,
            slug: question.slug || null,
            question_type: question.question_type,
            points: question.points ?? 1,
            time_limit: question.time_limit ?? null,
            explanation: question.explanation || null,
            media_id: question.media_id || null,
            media_type: question.media_id ? 'IMAGE' : null,
            difficulty_level: question.difficulty_level || dto.difficulty_level,
            sort_order: question.sort_order,
            is_required: question.is_required ?? true,
          },
        });
        questionIds.push(createdQuestion.id);
        if (question.options?.length) {
          await tx.questionOption.createMany({
            data: question.options.map((option) => ({
              question_id: createdQuestion.id,
              option_text: option.option_text,
              is_correct: option.is_correct,
              sort_order: option.sort_order,
              explanation: option.explanation || null,
            })),
          });
        }
      }

      const response = {
        id: quiz.id,
        title: quiz.title,
        slug: quiz.slug,
        is_active: quiz.is_active,
        questions_created: questionIds.length,
        question_ids: questionIds,
        partial_failure: false,
      };
      await tx.aiWriteIdempotency.update({
        where: { id: reservation.id },
        data: { status: 'COMPLETED', response },
      });
      return response as CreateQuizWithQuestionsResult;
    });

    try {
      const result = await run();
      if (result && typeof result === 'object' && 'id' in result) {
        await this.eventRepository.emit('QuizCreated', { id: result.id });
        for (const questionId of result.question_ids) {
          await this.eventRepository.emit('QuestionCreated', {
            id: questionId,
            quizId: result.id,
          });
        }
      }
      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.prisma.aiWriteIdempotency.findUnique({
          where: { user_id_idempotency_key: { user_id: creatorId, idempotency_key: key } },
        });
        if (existing?.request_hash === requestHash && existing.status === 'COMPLETED' && existing.response) {
          return existing.response as CreateQuizWithQuestionsResult;
        }
      }
      await Promise.allSettled(uploadedImageIds.map((imageId) => this.cloudinaryService.deleteImage(imageId)));
      throw error;
    }
  }

  async updateQuiz(
    id: string,
    updateData: Record<string, any>,
    creatorId: string,
    thumbnail?: Express.Multer.File,
    isAdmin = false,
  ): Promise<QuizResponseDto> {
    const existingQuiz = await this.quizRepository.findByIdRaw(id);
    if (!existingQuiz) {
      throw new NotFoundException('Quiz not found');
    }
    if (!isAdmin && existingQuiz.creator_id !== creatorId) {
      throw new ForbiddenException(
        'You are not authorized to update this quiz',
      );
    }

    // Check slug availability if slug is being updated
    if (updateData.slug && typeof updateData.slug === 'string') {
      const isSlugAvailable = await this.quizRepository.isSlugAvailable(
        updateData.slug,
        id,
      );
      if (!isSlugAvailable) {
        throw new BadRequestException('Slug already exists');
      }
    }

    // Handle thumbnail upload if provided
    let thumbnailId: string | undefined;
    if (thumbnail) {
      const uploadResult = await this.cloudinaryService.uploadImage(thumbnail);
      thumbnailId = uploadResult?.id;
    }

    // Prepare update data, excluding thumbnail file
    const { thumbnail: _thumbnail, ...quizWithoutThumbnail } = updateData;
    void _thumbnail;

    const dataToUpdate: Record<string, any> = {
      ...quizWithoutThumbnail,
      ...(thumbnailId ? { thumbnail_id: thumbnailId } : {}),
    };

    const updated = await this.quizRepository.updateQuiz(id, dataToUpdate);
    await this.eventRepository.emit('QuizUpdated', { id });
    return updated;
  }

  async remove(id: string, creatorId: string, isAdmin = false) {
    const existingQuiz = await this.quizRepository.findByIdRaw(id);
    if (!existingQuiz) {
      throw new NotFoundException('Quiz not found');
    }
    if (!isAdmin && existingQuiz.creator_id !== creatorId) {
      throw new ForbiddenException(
        'You are not authorized to delete this quiz',
      );
    }
    await this.quizRepository.delete({ id });
    return 'Quiz deleted successfully';
  }

  // Minimal no-op handlers to satisfy JobRepository validation
  @OnJob({ name: JobName.AssetDelete, queue: QueueName.BackgroundTask })
  assetDelete() {
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDeleteCheck, queue: QueueName.BackgroundTask })
  assetDeleteCheck() {
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.VersionCheck, queue: QueueName.BackgroundTask })
  versionCheck() {
    return JobStatus.Success;
  }

  // Compatibility stub: we don't use queued upload anymore, but validation requires a handler
  @OnJob({ name: JobName.UploadImage, queue: QueueName.ThumbnailGeneration })
  uploadImageJob() {
    return JobStatus.Success;
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
import { CreateQuizDto } from '../dtos/create-quiz.dto';
import { JobStatus, JobName, QueueName } from '@/common/enums';
import { OnJob } from '@/common/decorators';
import { PaginatedResponseDto } from '@/common/dtos/responses/base.response';
import { QuizPaginationQueryDto } from '../dtos/quiz-pagination.dto';
import { QuizResponseDto } from '../dtos/quiz-response.dto';

// Removed queue-based upload types in favor of direct Cloudinary upload

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
    }
    const { thumbnail: _thumbnail, ...quizWithoutThumbnail } = quiz;
    void _thumbnail;
    const quizData = {
      ...quizWithoutThumbnail,
      ...(creatorId ? { creator_id: creatorId } : {}),
      thumbnail_id: thumbnailId || null,
    };
    const created = await this.quizRepository.create(quizData);
    await this.eventRepository.emit('QuizCreated', { id: created.id });
    return created;
  }

  async updateQuiz(
    id: string,
    updateData: Record<string, any>,
    creatorId: string,
    thumbnail?: Express.Multer.File,
  ): Promise<QuizResponseDto> {
    const existingQuiz = await this.quizRepository.findByIdRaw(id);
    if (!existingQuiz) {
      throw new NotFoundException('Quiz not found');
    }
    if (existingQuiz.creator_id !== creatorId) {
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

  async remove(id: string, creatorId: string) {
    const existingQuiz = await this.quizRepository.findByIdRaw(id);
    if (!existingQuiz) {
      throw new NotFoundException('Quiz not found');
    }
    if (existingQuiz.creator_id !== creatorId) {
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

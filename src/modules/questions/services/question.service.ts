import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
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

@Injectable()
export class QuestionService extends BaseService {
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

    // Prepare question data without options (options handled via separate API)
    const questionData: Record<string, any> = {
      ...question,
      media_id: mediaId || null,
    };

    return await this.questionRepository.createWithOptions(questionData);
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

    // Prepare update data without options (options handled via separate API)
    const dataToUpdate: Record<string, any> = {
      ...updateData,
      ...(mediaId ? { media_id: mediaId } : {}),
    };

    return await this.questionRepository.updateQuestion(id, dataToUpdate);
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
    };

    return await this.createQuestion(duplicateData);
  }
}

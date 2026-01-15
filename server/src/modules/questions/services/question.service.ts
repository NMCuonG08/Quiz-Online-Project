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
    // Verify quiz exists - check both ID and slug
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        quizId,
      );
    const quiz = isUUID
      ? await this.quizRepository.findByIdRaw(quizId)
      : await this.quizRepository.findBySlug(quizId);

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    const targetQuizId = quiz.id;

    const result = await this.questionRepository.paginateWithRelations(
      paginationQuery,
      { quiz_id: targetQuizId },
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

    // Parse options if provided
    let optionsData: any[] | undefined;
    if (question.options) {
      try {
        optionsData =
          typeof question.options === 'string'
            ? JSON.parse(question.options)
            : question.options;
      } catch (e) {
        console.error('Failed to parse options:', e);
      }
    }

    // Prepare question data without options
    const { options, ...restOfQuestion } = question;
    const questionData: Record<string, any> = {
      ...restOfQuestion,
      media_id: mediaId || null,
    };

    const created = await this.questionRepository.createWithOptions(
      questionData,
      optionsData,
    );
    await this.eventRepository.emit('QuestionCreated', {
      id: created.id,
      quizId: created.quiz_id,
    } as any);
    return created;
  }

  async updateQuestion(
    id: string,
    updateData: UpdateQuestionDto,
    media?: Express.Multer.File,
    optionMediaFiles?: Express.Multer.File[],
  ): Promise<QuestionResponseDto> {
    console.log('Update Question Request:', { id, updateDataKeys: Object.keys(updateData), media: !!media });
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

    // Handle question media upload if provided
    let mediaId: string | undefined;
    if (media) {
      const uploadResult = await this.cloudinaryService.uploadImage(media);
      mediaId = uploadResult?.id;
    }

    // Parse options if provided
    let optionsData: any[] | undefined;
    if (updateData.options) {
      try {
        optionsData =
          typeof updateData.options === 'string'
            ? JSON.parse(updateData.options)
            : updateData.options;
      } catch (e) {
        console.error('Failed to parse options:', e);
      }
    }

    // Handle option media files if provided
    if (optionsData && optionMediaFiles && optionMediaFiles.length > 0) {
      for (const file of optionMediaFiles) {
        // Extract option index from fieldname (e.g., "option_0_media" -> 0)
        const match = file.fieldname.match(/option_(\d+)_media/);
        if (match) {
          const optionIndex = parseInt(match[1], 10);
          if (optionsData[optionIndex]) {
            // Upload the option media file
            const optionUploadResult = await this.cloudinaryService.uploadImage(file);
            if (optionUploadResult?.url) {
              // QuestionOption uses media_url field, not media_id
              optionsData[optionIndex].media_url = optionUploadResult.url;
            }
          }
        }
      }
    }

    // Prepare update data without options - only include valid question fields
    const { options, ...restOfUpdateData } = updateData;
    
    // Clean and convert the update data
    const dataToUpdate: Record<string, any> = {};
    
    if (restOfUpdateData.question_text !== undefined) {
      dataToUpdate.question_text = String(restOfUpdateData.question_text);
    }
    if (restOfUpdateData.slug !== undefined) {
      dataToUpdate.slug = String(restOfUpdateData.slug);
    }
    if (restOfUpdateData.question_type !== undefined) {
      dataToUpdate.question_type = String(restOfUpdateData.question_type);
    }
    if (restOfUpdateData.points !== undefined) {
      dataToUpdate.points = Number(restOfUpdateData.points);
    }
    if (restOfUpdateData.time_limit !== undefined) {
      dataToUpdate.time_limit = Number(restOfUpdateData.time_limit);
    }
    if (restOfUpdateData.explanation !== undefined) {
      dataToUpdate.explanation = restOfUpdateData.explanation ? String(restOfUpdateData.explanation) : null;
    }
    if (restOfUpdateData.difficulty_level !== undefined) {
      dataToUpdate.difficulty_level = String(restOfUpdateData.difficulty_level);
    }
    if (restOfUpdateData.sort_order !== undefined) {
      dataToUpdate.sort_order = Number(restOfUpdateData.sort_order);
    }
    if (restOfUpdateData.is_required !== undefined) {
      dataToUpdate.is_required = restOfUpdateData.is_required === true || String(restOfUpdateData.is_required) === 'true';
    }
    if (restOfUpdateData.settings !== undefined) {
      dataToUpdate.settings = restOfUpdateData.settings;
    }
    
    // Process media_id from body (e.g., if set to null to remove image)
    if (restOfUpdateData.media_id !== undefined) {
      // Handle 'null' string from FormData
      if (restOfUpdateData.media_id === 'null' || restOfUpdateData.media_id === null) {
        dataToUpdate.media_id = null;
      } else {
        dataToUpdate.media_id = String(restOfUpdateData.media_id);
      }
    }

    // New media upload always takes precedence
    if (mediaId) {
      dataToUpdate.media_id = mediaId;
    }
    
    console.log('=== UPDATE QUESTION DEBUG ===');
    console.log('dataToUpdate:', JSON.stringify(dataToUpdate, null, 2));
    console.log('optionsData:', JSON.stringify(optionsData, null, 2));
    console.log('=============================');

    const updated = await this.questionRepository.updateQuestion(
      id,
      dataToUpdate,
      optionsData,
    );
    await this.eventRepository.emit('QuestionUpdated', {
      id,
      quizId: updated.quiz_id,
    } as any);
    return updated;
  }

  async deleteQuestion(id: string): Promise<void> {
    const existingQuestion = await this.questionRepository.findByIdRaw(id);
    if (!existingQuestion) {
      throw new NotFoundException('Question not found');
    }

    await this.questionRepository.deleteQuestion(id);
    await this.eventRepository.emit('QuestionDeleted', {
      id,
      quizId: '',
    } as any);
  }

  async getQuestionsByQuizId(quizId: string): Promise<QuestionResponseDto[]> {
    // Verify quiz exists - support both ID and slug
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        quizId,
      );
    const quiz = isUUID
      ? await this.quizRepository.findByIdRaw(quizId)
      : await this.quizRepository.findBySlug(quizId);

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return await this.questionRepository.getQuestionsByQuiz(quiz.id);
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

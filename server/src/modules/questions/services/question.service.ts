import {
  BadRequestException,
  ForbiddenException,
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

type NormalizedQuestionOption = {
  option_text: string;
  is_correct: boolean;
  sort_order: number;
  explanation?: string;
  media_url?: string;
};

export function parseQuestionOptions(
  value: unknown,
): NormalizedQuestionOption[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  let parsed: unknown = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      throw new BadRequestException('Dữ liệu đáp án không phải JSON hợp lệ');
    }
  }
  if (!Array.isArray(parsed)) {
    throw new BadRequestException('Danh sách đáp án phải là một mảng');
  }
  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new BadRequestException(`Đáp án ${index + 1} không hợp lệ`);
    }
    const option = item as Record<string, unknown>;
    const optionText =
      option.option_text ??
      option.text ??
      option.content ??
      option.label ??
      option.value;
    if (typeof optionText !== 'string' || !optionText.trim()) {
      throw new BadRequestException(
        `Đáp án ${index + 1} thiếu nội dung option_text`,
      );
    }
    const rawCorrect = option.is_correct;
    if (
      rawCorrect !== true &&
      rawCorrect !== false &&
      rawCorrect !== 'true' &&
      rawCorrect !== 'false'
    ) {
      throw new BadRequestException(
        `Đáp án ${index + 1} thiếu trạng thái is_correct hợp lệ`,
      );
    }
    const rawOrder = option.sort_order ?? index + 1;
    const sortOrder = Number(rawOrder);
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      throw new BadRequestException(
        `Đáp án ${index + 1} có sort_order không hợp lệ`,
      );
    }
    return {
      option_text: optionText.trim(),
      is_correct: rawCorrect === true || rawCorrect === 'true',
      sort_order: sortOrder,
      ...(typeof option.explanation === 'string' && option.explanation
        ? { explanation: option.explanation }
        : {}),
      ...(typeof option.media_url === 'string' && option.media_url
        ? { media_url: option.media_url }
        : {}),
    };
  });
}

export function validateQuestionOptions(
  questionType: QuestionTypeEnum | string,
  options: NormalizedQuestionOption[] | undefined,
): void {
  const normalizedType = String(questionType);
  const choiceTypes = new Set<string>([
    String(QuestionTypeEnum.SINGLE_CHOICE),
    String(QuestionTypeEnum.MULTIPLE_CHOICE),
    String(QuestionTypeEnum.TRUE_FALSE),
  ]);
  if (!choiceTypes.has(normalizedType)) return;
  if (!options || options.length < 2) {
    throw new BadRequestException('Câu hỏi lựa chọn cần ít nhất 2 đáp án');
  }
  const correctCount = options.filter((option) => option.is_correct).length;
  if (
    [
      String(QuestionTypeEnum.SINGLE_CHOICE),
      String(QuestionTypeEnum.TRUE_FALSE),
    ].includes(normalizedType) &&
    correctCount !== 1
  ) {
    throw new BadRequestException('Câu hỏi một đáp án cần đúng 1 đáp án đúng');
  }
  if (
    normalizedType === String(QuestionTypeEnum.MULTIPLE_CHOICE) &&
    correctCount < 1
  ) {
    throw new BadRequestException(
      'Câu hỏi nhiều đáp án cần ít nhất 1 đáp án đúng',
    );
  }
}

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
    userId?: string,
    isAdmin = false,
  ): Promise<QuestionResponseDto> {
    // Verify quiz exists
    const quiz = await this.quizRepository.findByIdRaw(question.quiz_id);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    await this.assertQuizOwner(quiz.id, userId, isAdmin);

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
    const optionsData = parseQuestionOptions(question.options);
    validateQuestionOptions(question.question_type, optionsData);

    // Prepare question data without options
    const restOfQuestion = { ...question };
    delete restOfQuestion.options;
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
    });
    return created;
  }

  async updateQuestion(
    id: string,
    updateData: UpdateQuestionDto,
    media?: Express.Multer.File,
    optionMediaFiles?: Express.Multer.File[],
    userId?: string,
    isAdmin = false,
  ): Promise<QuestionResponseDto> {
    console.log('Update Question Request:', {
      id,
      updateDataKeys: Object.keys(updateData),
      media: !!media,
    });
    const existingQuestion = await this.questionRepository.findByIdRaw(id);
    if (!existingQuestion) {
      throw new NotFoundException('Question not found');
    }
    await this.assertQuizOwner(existingQuestion.quiz_id, userId, isAdmin);

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
    const optionsData = parseQuestionOptions(updateData.options);
    if (optionsData !== undefined) {
      validateQuestionOptions(
        updateData.question_type || existingQuestion.question_type,
        optionsData,
      );
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
            const optionUploadResult =
              await this.cloudinaryService.uploadImage(file);
            if (optionUploadResult?.url) {
              // QuestionOption uses media_url field, not media_id
              optionsData[optionIndex].media_url = optionUploadResult.url;
            }
          }
        }
      }
    }

    // Prepare update data without options - only include valid question fields
    const restOfUpdateData = { ...updateData };
    delete restOfUpdateData.options;

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
      dataToUpdate.explanation = restOfUpdateData.explanation
        ? String(restOfUpdateData.explanation)
        : null;
    }
    if (restOfUpdateData.difficulty_level !== undefined) {
      dataToUpdate.difficulty_level = String(restOfUpdateData.difficulty_level);
    }
    if (restOfUpdateData.sort_order !== undefined) {
      dataToUpdate.sort_order = Number(restOfUpdateData.sort_order);
    }
    if (restOfUpdateData.is_required !== undefined) {
      dataToUpdate.is_required =
        restOfUpdateData.is_required === true ||
        String(restOfUpdateData.is_required) === 'true';
    }
    if (restOfUpdateData.settings !== undefined) {
      dataToUpdate.settings = restOfUpdateData.settings;
    }

    // Process media_id from body (e.g., if set to null to remove image)
    if (restOfUpdateData.media_id !== undefined) {
      // Handle 'null' string from FormData
      if (
        restOfUpdateData.media_id === 'null' ||
        restOfUpdateData.media_id === null
      ) {
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
    });
    return updated;
  }

  async deleteQuestion(
    id: string,
    userId?: string,
    isAdmin = false,
  ): Promise<void> {
    const existingQuestion = await this.questionRepository.findByIdRaw(id);
    if (!existingQuestion) {
      throw new NotFoundException('Question not found');
    }
    await this.assertQuizOwner(existingQuestion.quiz_id, userId, isAdmin);

    await this.questionRepository.deleteQuestion(id);
    await this.eventRepository.emit('QuestionDeleted', {
      id,
      quizId: '',
    });
  }

  private async assertQuizOwner(
    quizId: string,
    userId?: string,
    isAdmin = false,
  ): Promise<void> {
    if (isAdmin) return;
    if (!userId) throw new ForbiddenException('User not authenticated');
    const quiz = await this.quizRepository.findByIdRaw(quizId);
    if (!quiz || quiz.creator_id !== userId) {
      throw new ForbiddenException(
        'You are not authorized to modify this quiz questions',
      );
    }
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
    userId?: string,
    isAdmin = false,
  ): Promise<void> {
    // Verify quiz exists
    const quiz = await this.quizRepository.findByIdRaw(quizId);
    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }
    await this.assertQuizOwner(quizId, userId, isAdmin);
    const questionIds = questionOrders.map((item) => item.id);
    const matchingQuestions = await this.prisma.question.count({
      where: { id: { in: questionIds }, quiz_id: quizId },
    });
    if (matchingQuestions !== questionIds.length) {
      throw new BadRequestException(
        'All reordered questions must belong to this quiz',
      );
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
    userId?: string,
    isAdmin = false,
  ): Promise<QuestionResponseDto> {
    const existingQuestion = await this.questionRepository.findByIdRaw(id);
    if (!existingQuestion) {
      throw new NotFoundException('Question not found');
    }
    await this.assertQuizOwner(existingQuestion.quiz_id, userId, isAdmin);

    // If newQuizId is provided, verify it exists
    if (newQuizId) {
      const quiz = await this.quizRepository.findByIdRaw(newQuizId);
      if (!quiz) {
        throw new NotFoundException('Target quiz not found');
      }
      await this.assertQuizOwner(newQuizId, userId, isAdmin);
    }

    const sourceQuestion = await this.questionRepository.findById(id);
    if (!sourceQuestion) throw new NotFoundException('Question not found');

    // Prepare duplicate data
    const duplicateData: CreateQuestionDto = {
      quiz_id: newQuizId || existingQuestion.quiz_id,
      question_text: `${sourceQuestion.question_text} (Copy)`,
      slug: sourceQuestion.slug ? `${sourceQuestion.slug}-copy` : undefined,
      question_type: sourceQuestion.question_type as QuestionTypeEnum,
      points: sourceQuestion.points,
      time_limit: sourceQuestion.time_limit,
      explanation: sourceQuestion.explanation,
      media_id: sourceQuestion.media_id,
      media_type: sourceQuestion.media_type as MediaTypeEnum,
      difficulty_level: sourceQuestion.difficulty_level as DifficultyLevelEnum,
      sort_order: sourceQuestion.sort_order + 1,
      is_required: sourceQuestion.is_required,
      settings: sourceQuestion.settings,
      options: sourceQuestion.options?.map((option) => ({
        option_text: option.option_text,
        is_correct: option.is_correct,
        sort_order: option.sort_order,
        explanation: option.explanation,
        media_url: option.media_url,
      })),
    };

    return await this.createQuestion(duplicateData, undefined, userId, isAdmin);
  }
}

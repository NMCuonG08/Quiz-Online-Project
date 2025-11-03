import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { QuestionOption } from '@prisma/client';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';
import { QuestionOptionResponseDto } from '../dtos/question-option-response.dto';
import { mapQuestionOptionToResponseDto } from '../mappers/question-option-mapper';

@Injectable()
export class QuestionOptionRepository extends BaseRepository<QuestionOption> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.questionOption;
  }

  async paginateWithRelations(
    paginationDto: PaginationQueryDto,
    where?: Record<string, any>,
  ) {
    const { page = 1, limit = 10, sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || 'asc' }
      : { sort_order: 'asc' as const };

    const dataPromise = this.prisma.questionOption.findMany({
      where: where || {},
      skip,
      take,
      orderBy,
      include: {
        question: {
          select: {
            question_text: true,
            question_type: true,
          },
        },
      },
    });

    const totalPromise = this.prisma.questionOption.count({
      where: where || {},
    });

    const [data, total] = await Promise.all([dataPromise, totalPromise]);

    // Transform to response DTO using mapper
    const responseData: QuestionOptionResponseDto[] = data.map(
      mapQuestionOptionToResponseDto,
    );

    return {
      data: responseData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const option = await this.prisma.questionOption.findUnique({
      where: { id },
      include: {
        question: {
          select: {
            question_text: true,
            question_type: true,
          },
        },
      },
    });
    return option ? mapQuestionOptionToResponseDto(option) : null;
  }

  async findByIdRaw(id: string) {
    return await this.prisma.questionOption.findUnique({
      where: { id },
      select: {
        id: true,
        question_id: true,
        option_text: true,
        is_correct: true,
        sort_order: true,
      },
    });
  }

  async findByQuestionId(questionId: string) {
    const options = await this.prisma.questionOption.findMany({
      where: { question_id: questionId },
      include: {
        question: {
          select: {
            question_text: true,
            question_type: true,
          },
        },
      },
      orderBy: {
        sort_order: 'asc',
      },
    });
    return options.map(mapQuestionOptionToResponseDto);
  }

  async findCorrectOptionsByQuestionId(questionId: string) {
    const options = await this.prisma.questionOption.findMany({
      where: {
        question_id: questionId,
        is_correct: true,
      },
      include: {
        question: {
          select: {
            question_text: true,
            question_type: true,
          },
        },
      },
      orderBy: {
        sort_order: 'asc',
      },
    });
    return options.map(mapQuestionOptionToResponseDto);
  }

  async updateOption(id: string, data: any) {
    const updatedOption = await this.prisma.questionOption.update({
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
    });
    return mapQuestionOptionToResponseDto(updatedOption);
  }

  async deleteOption(id: string) {
    return await this.prisma.questionOption.delete({
      where: { id },
    });
  }

  async deleteOptionsByQuestionId(questionId: string) {
    return await this.prisma.questionOption.deleteMany({
      where: { question_id: questionId },
    });
  }

  async reorderOptions(
    questionId: string,
    optionOrders: { id: string; sort_order: number }[],
  ) {
    return await this.prisma.$transaction(
      optionOrders.map(({ id, sort_order }) =>
        this.prisma.questionOption.update({
          where: { id },
          data: { sort_order },
        }),
      ),
    );
  }

  async getOptionsCountByQuestionId(questionId: string) {
    return await this.prisma.questionOption.count({
      where: { question_id: questionId },
    });
  }

  async getCorrectOptionsCountByQuestionId(questionId: string) {
    return await this.prisma.questionOption.count({
      where: {
        question_id: questionId,
        is_correct: true,
      },
    });
  }

  async createWithRelations(data: any) {
    const createdOption = await this.prisma.questionOption.create({
      data,
      include: {
        question: {
          select: {
            question_text: true,
            question_type: true,
          },
        },
      },
    });
    return mapQuestionOptionToResponseDto(createdOption);
  }
}

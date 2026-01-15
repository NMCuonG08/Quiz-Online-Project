import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { Question } from '@prisma/client';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';
import { QuestionResponseDto } from '../dtos/question-response.dto';
import { mapQuestionToResponseDto } from '../mappers/question-mapper';

@Injectable()
export class QuestionRepository extends BaseRepository<Question> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.question;
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

    const dataPromise = this.prisma.question.findMany({
      where: where || {},
      skip,
      take,
      orderBy,
      include: {
        quiz: {
          select: {
            title: true,
          },
        },
        media: {
          select: {
            url: true,
          },
        },
        options: {
          orderBy: {
            sort_order: 'asc',
          },
        },
        _count: {
          select: {
            options: true,
          },
        },
      },
    });

    const totalPromise = this.prisma.question.count({ where: where || {} });

    const [data, total] = await Promise.all([dataPromise, totalPromise]);

    // Transform to response DTO using mapper
    const responseData: QuestionResponseDto[] = data.map(
      mapQuestionToResponseDto,
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
    const question = await this.prisma.question.findUnique({
      where: { id },
      include: {
        quiz: {
          select: {
            title: true,
          },
        },
        media: {
          select: {
            url: true,
          },
        },
        options: {
          orderBy: {
            sort_order: 'asc',
          },
        },
        _count: {
          select: {
            options: true,
          },
        },
      },
    });
    return question ? mapQuestionToResponseDto(question) : null;
  }

  async findByIdRaw(id: string) {
    return await this.prisma.question.findUnique({
      where: { id },
      select: {
        id: true,
        quiz_id: true,
        question_text: true,
        question_type: true,
        points: true,
        sort_order: true,
      },
    });
  }

  async findByQuizId(quizId: string) {
    const questions = await this.prisma.question.findMany({
      where: { quiz_id: quizId },
      include: {
        quiz: {
          select: {
            title: true,
          },
        },
        media: {
          select: {
            url: true,
          },
        },
        options: {
          orderBy: {
            sort_order: 'asc',
          },
        },
        _count: {
          select: {
            options: true,
          },
        },
      },
      orderBy: {
        sort_order: 'asc',
      },
    });
    return questions.map(mapQuestionToResponseDto);
  }

  async isSlugAvailable(slug: string, excludeId?: string) {
    const question = await this.prisma.question.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return !question;
  }

  async createWithOptions(questionData: any, optionsData?: any[]) {
    return await this.prisma.$transaction(async (tx) => {
      // Create the question
      const question = await tx.question.create({
        data: questionData,
        include: {
          quiz: {
            select: {
              title: true,
            },
          },
          media: {
            select: {
              url: true,
            },
          },
          options: {
            orderBy: {
              sort_order: 'asc',
            },
          },
          _count: {
            select: {
              options: true,
            },
          },
        },
      });

      // Create options if provided
      if (optionsData && optionsData.length > 0) {
        await tx.questionOption.createMany({
          data: optionsData.map((option, index) => {
            const cleanOption: any = {
              question_id: question.id,
              sort_order: typeof option.sort_order === 'number' ? option.sort_order : index + 1,
            };
            
            if (option.option_text !== undefined) {
              cleanOption.option_text = String(option.option_text || '');
            }
            if (option.explanation !== undefined && option.explanation !== null) {
              cleanOption.explanation = String(option.explanation);
            }
            if (option.is_correct !== undefined) {
              cleanOption.is_correct = option.is_correct === true || option.is_correct === 'true';
            }
            cleanOption.media_url = option.media_url || null;
            
            return cleanOption;
          }),
        });

        // Fetch the question again with options
        const questionWithOptions = await tx.question.findFirst({
          where: { id: question.id },
          include: {
            quiz: {
              select: {
                title: true,
              },
            },
            media: {
              select: {
                url: true,
              },
            },
            options: {
              orderBy: {
                sort_order: 'asc',
              },
            },
            _count: {
              select: {
                options: true,
              },
            },
          },
        });

        if (!questionWithOptions) {
          throw new Error('Failed to fetch created question with options');
        }
        return mapQuestionToResponseDto(questionWithOptions);
      }

      return mapQuestionToResponseDto(question);
    });
  }

  async updateQuestion(id: string, data: any, optionsData?: any[]) {
    return await this.prisma.$transaction(async (tx) => {
      // Update the question
      const updatedQuestion = await tx.question.update({
        where: { id },
        data,
        include: {
          quiz: {
            select: {
              title: true,
            },
          },
          media: {
            select: {
              url: true,
            },
          },
          options: {
            orderBy: {
              sort_order: 'asc',
            },
          },
          _count: {
            select: {
              options: true,
            },
          },
        },
      });

      // Update options if provided
      if (optionsData && optionsData.length > 0) {
        // Delete existing options
        await tx.questionOption.deleteMany({
          where: { question_id: id },
        });

        // Create new options with proper type conversion
        await tx.questionOption.createMany({
          data: optionsData.map((option, index) => {
            // Clean and convert option data to correct types
            const cleanOption: any = {
              question_id: id,
              sort_order: typeof option.sort_order === 'number' ? option.sort_order : index + 1,
            };
            
            // String fields
            if (option.option_text !== undefined) {
              cleanOption.option_text = String(option.option_text || '');
            }
            if (option.explanation !== undefined && option.explanation !== null) {
              cleanOption.explanation = String(option.explanation);
            }
            
            // Boolean field
            if (option.is_correct !== undefined) {
              cleanOption.is_correct = option.is_correct === true || option.is_correct === 'true';
            }
            
            // Media URL field
            cleanOption.media_url = option.media_url || null;
            
            return cleanOption;
          }),
        });

        // Fetch the question again with updated options
        const questionWithOptions = await tx.question.findFirst({
          where: { id },
          include: {
            quiz: {
              select: {
                title: true,
              },
            },
            media: {
              select: {
                url: true,
              },
            },
            options: {
              orderBy: {
                sort_order: 'asc',
              },
            },
            _count: {
              select: {
                options: true,
              },
            },
          },
        });

        if (!questionWithOptions) {
          throw new Error('Failed to fetch updated question with options');
        }
        return mapQuestionToResponseDto(questionWithOptions);
      }

      return mapQuestionToResponseDto(updatedQuestion);
    });
  }

  async findBySlug(slug: string) {
    const question = await this.prisma.question.findFirst({
      where: { slug },
      include: {
        quiz: {
          select: {
            title: true,
          },
        },
        media: {
          select: {
            url: true,
          },
        },
        options: {
          orderBy: {
            sort_order: 'asc',
          },
        },
        _count: {
          select: {
            options: true,
          },
        },
      },
    });
    return question ? mapQuestionToResponseDto(question) : null;
  }

  async getQuestionsByQuiz(quizId: string) {
    const questions = await this.prisma.question.findMany({
      where: { quiz_id: quizId },
      include: {
        quiz: {
          select: {
            title: true,
          },
        },
        media: {
          select: {
            url: true,
          },
        },
        options: {
          orderBy: {
            sort_order: 'asc',
          },
        },
        _count: {
          select: {
            options: true,
          },
        },
      },
      orderBy: {
        sort_order: 'asc',
      },
    });
    return questions.map(mapQuestionToResponseDto);
  }

  async deleteQuestion(id: string) {
    return await this.prisma.$transaction(async (tx) => {
      // Delete options first (due to foreign key constraint)
      await tx.questionOption.deleteMany({
        where: { question_id: id },
      });

      // Delete the question
      return await tx.question.delete({
        where: { id },
      });
    });
  }
}

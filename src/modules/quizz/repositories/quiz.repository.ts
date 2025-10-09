import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { Quiz } from '@prisma/client';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';
import { QuizResponseDto } from '../dtos/quiz-response.dto';
import { mapQuizToResponseDto } from '../mappers/quiz-mapper';

@Injectable()
export class QuizRepository extends BaseRepository<Quiz> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.quiz;
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
      : { created_at: 'desc' as const };

    const dataPromise = this.prisma.quiz.findMany({
      where: where || {},
      skip,
      take,
      orderBy,
      include: {
        category: {
          select: {
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
          },
        },
        thumbnail: {
          select: {
            url: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });

    const totalPromise = this.prisma.quiz.count({ where: where || {} });

    const [data, total] = await Promise.all([dataPromise, totalPromise]);

    // Transform to response DTO using mapper
    const responseData: QuizResponseDto[] = data.map(mapQuizToResponseDto);

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
    const quiz = await this.prisma.quiz.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
          },
        },
        thumbnail: {
          select: {
            url: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });
    return quiz ? mapQuizToResponseDto(quiz) : null;
  }

  async findByIdRaw(id: string) {
    return await this.prisma.quiz.findUnique({
      where: { id },
      select: {
        id: true,
        creator_id: true,
      },
    });
  }

  async isSlugAvailable(slug: string, excludeId?: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return !quiz;
  }

  async updateQuiz(id: string, data: any) {
    const updatedQuiz = await this.prisma.quiz.update({
      where: { id },
      data,
      include: {
        category: {
          select: {
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
          },
        },
        thumbnail: {
          select: {
            url: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });
    return mapQuizToResponseDto(updatedQuiz);
  }

  async findBySlug(slug: string) {
    const quiz = await this.prisma.quiz.findFirst({
      where: { slug },
      include: {
        category: {
          select: {
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
          },
        },
        thumbnail: {
          select: {
            url: true,
          },
        },
        _count: {
          select: {
            questions: true,
            attempts: true,
          },
        },
      },
    });
    return quiz ? mapQuizToResponseDto(quiz) : null;
  }
}

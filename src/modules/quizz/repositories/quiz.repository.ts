import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { Quiz } from '@prisma/client';
import { QuizResponseDto } from '../dtos/quiz-response.dto';
import { mapQuizToResponseDto } from '../mappers/quiz-mapper';
import { QuizSortCriteria } from '@/common/enums';
import { QuizPaginationQueryDto } from '../dtos/quiz-pagination.dto';

@Injectable()
export class QuizRepository extends BaseRepository<Quiz> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.quiz;
  }

  async paginateWithRelations(
    paginationDto: QuizPaginationQueryDto,
    where?: Record<string, any>,
  ) {
    const { page = 1, limit = 10, sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy = this.buildOrderBy(sortBy, sortOrder) as any;
    const whereClause = this.buildWhereClause(where, paginationDto);

    const dataPromise = this.prisma.quiz.findMany({
      where: whereClause,
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
            username: true,
            full_name: true,
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

    const totalPromise = this.prisma.quiz.count({ where: whereClause });

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
            username: true,
            full_name: true,
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

  async updateQuiz(id: string, data: Record<string, any>) {
    const updatedQuiz = await this.prisma.quiz.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: data as any, // Prisma requires type assertion for dynamic data
      include: {
        category: {
          select: {
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            username: true,
            full_name: true,
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
            username: true,
            full_name: true,
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

  private buildOrderBy(
    sortBy?: QuizSortCriteria,
    sortOrder?: 'asc' | 'desc',
  ): any {
    if (!sortBy) {
      return { created_at: 'desc' as const };
    }

    const order: 'asc' | 'desc' = sortOrder || 'desc';

    switch (sortBy) {
      case QuizSortCriteria.RECENTLY_PUBLISHED:
        return { created_at: order };

      case QuizSortCriteria.BEST_RATING:
        return {
          average_rating: order,
        };

      case QuizSortCriteria.POPULAR:
        return {
          attempts: {
            _count: order,
          },
        };

      case QuizSortCriteria.EASY:
        return { difficulty_level: 'asc' as const };

      case QuizSortCriteria.HARD:
        return { difficulty_level: 'desc' as const };

      case QuizSortCriteria.MOST_QUESTIONS:
        return {
          questions: {
            _count: order,
          },
        };

      case QuizSortCriteria.LEAST_QUESTIONS:
        return {
          questions: {
            _count: order === 'desc' ? 'asc' : 'desc',
          },
        };

      case QuizSortCriteria.MOST_ATTEMPTS:
        return {
          attempts: {
            _count: order,
          },
        };

      case QuizSortCriteria.ALPHABETICAL:
        return { title: order };

      default:
        return { created_at: 'desc' as const };
    }
  }

  private buildWhereClause(
    where?: Record<string, any>,
    paginationDto?: QuizPaginationQueryDto,
  ) {
    const baseWhere = where || {};
    const additionalFilters: Record<string, any> = {};

    // Search by title or description
    if (paginationDto?.search) {
      additionalFilters.OR = [
        {
          title: { contains: paginationDto.search, mode: 'insensitive' },
        },
        {
          description: { contains: paginationDto.search, mode: 'insensitive' },
        },
      ];
    }

    // Filter by difficulty
    if (paginationDto?.difficulty) {
      additionalFilters.difficulty_level =
        paginationDto.difficulty.toUpperCase();
    }

    // Filter by minimum rating
    if (paginationDto?.minRating) {
      additionalFilters.statistics = {
        average_score: {
          gte: paginationDto.minRating,
        },
      };
    }

    return {
      ...baseWhere,
      ...additionalFilters,
    };
  }

  // Specialized methods for different sort criteria
  async getRecentlyPublishedQuizzes(paginationDto: QuizPaginationQueryDto) {
    return this.paginateWithRelations({
      ...paginationDto,
      sortBy: QuizSortCriteria.RECENTLY_PUBLISHED,
    });
  }

  async getBestRatedQuizzes(paginationDto: QuizPaginationQueryDto) {
    return this.paginateWithRelations({
      ...paginationDto,
      sortBy: QuizSortCriteria.BEST_RATING,
    });
  }

  async getPopularQuizzes(paginationDto: QuizPaginationQueryDto) {
    return this.paginateWithRelations({
      ...paginationDto,
      sortBy: QuizSortCriteria.POPULAR,
    });
  }

  async getEasyQuizzes(paginationDto: QuizPaginationQueryDto) {
    return this.paginateWithRelations({
      ...paginationDto,
      sortBy: QuizSortCriteria.EASY,
      difficulty: 'easy',
    });
  }

  async getHardQuizzes(paginationDto: QuizPaginationQueryDto) {
    return this.paginateWithRelations({
      ...paginationDto,
      sortBy: QuizSortCriteria.HARD,
      difficulty: 'hard',
    });
  }

  async searchQuizzes(paginationDto: QuizPaginationQueryDto) {
    return this.paginateWithRelations(paginationDto);
  }
}

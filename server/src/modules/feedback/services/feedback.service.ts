import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RatingRepository } from '../repositories/rating.repository';
import { CreateRatingDto } from '../dtos/create-rating.dto';
import { RatingPaginationQueryDto } from '../dtos/rating-pagination.dto';
import { RatingMapper } from '../mappers/rating.mapper';
import { PaginatedResponseDto } from '@/common/dtos/responses/base.response';
import { RatingResponseDto } from '../dtos/rating-response.dto';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly ratingRepository: RatingRepository,
    private readonly prisma: PrismaService,
  ) {}

  async createOrUpdateRating(userId: string, createDto: CreateRatingDto): Promise<RatingResponseDto> {
    const existing = await this.ratingRepository.findFirst({
      quiz_id: createDto.quiz_id,
      user_id: userId,
    });

    let ratingTemp;
    if (existing) {
      ratingTemp = await this.ratingRepository.update(
        { id: existing.id },
        { rating: createDto.rating, comment: createDto.comment }
      );
    } else {
      ratingTemp = await this.ratingRepository.create({
        quiz_id: createDto.quiz_id,
        user_id: userId,
        rating: createDto.rating,
        comment: createDto.comment,
      });
    }

    // Update Quiz rating stats (avg and total)
    const stats = await this.prisma.quizRating.aggregate({
      where: { quiz_id: createDto.quiz_id },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.quiz.update({
      where: { id: createDto.quiz_id },
      data: {
        average_rating: stats._avg.rating || 0,
        total_ratings: stats._count.rating || 0,
      }
    });

    // fetch the resulting rating with user
    const fullRating = await this.prisma.quizRating.findUnique({
      where: { id: ratingTemp.id },
      include: { user: { select: { id: true, username: true, full_name: true, avatar: true } } }
    });

    return RatingMapper.toResponseDto(fullRating);
  }

  async getRatings(query: RatingPaginationQueryDto): Promise<PaginatedResponseDto<RatingResponseDto>> {
    const where: any = {};
    if (query.quiz_id) {
      where.quiz_id = query.quiz_id;
    }

    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.quizRating.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              full_name: true,
              avatar: true,
            }
          }
        }
      }),
      this.prisma.quizRating.count({ where })
    ]);

    return new PaginatedResponseDto(
      data.map(RatingMapper.toResponseDto),
      Number(page),
      Number(limit),
      total
    );
  }

  async deleteRating(userId: string, quizId: string) {
    const existing = await this.ratingRepository.findFirst({
      quiz_id: quizId,
      user_id: userId,
    });
    
    if (!existing) throw new NotFoundException('Rating not found');

    await this.ratingRepository.delete({ id: existing.id });

    // Update Quiz rating stats
    const stats = await this.prisma.quizRating.aggregate({
      where: { quiz_id: quizId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await this.prisma.quiz.update({
      where: { id: quizId },
      data: {
        average_rating: stats._avg.rating || 0,
        total_ratings: stats._count.rating || 0,
      }
    });

    return { success: true };
  }
}

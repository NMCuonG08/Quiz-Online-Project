import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { Course } from '@prisma/client';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';

@Injectable()
export class CourseRepository extends BaseRepository<Course> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.course;
  }

  async findWithRelations(id: string) {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        category: true,
        creator: true,
        modules: {
          include: {
            lessons: true,
          },
        },
      },
    });
  }

  async paginateWithRelations(paginationDto: PaginationQueryDto, where?: any) {
    const { page = 1, limit = 10, sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;
    const take = limit;

    const orderBy = sortBy
      ? { [sortBy]: sortOrder || 'asc' }
      : { created_at: 'desc' };

    const dataPromise = this.prisma.course.findMany({
      where,
      skip,
      take,
      orderBy: orderBy as any,
      include: {
        category: true,
        creator: true,
      },
    });

    const totalPromise = this.prisma.course.count({ where });

    const [data, total] = await Promise.all([dataPromise, totalPromise]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async isSlugAvailable(slug: string, excludeId?: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    return !course;
  }
}

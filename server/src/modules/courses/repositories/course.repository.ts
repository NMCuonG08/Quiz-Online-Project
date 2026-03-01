import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { Course } from '@prisma/client';

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
          }
        },
      }
    });
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

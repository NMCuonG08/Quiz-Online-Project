import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CourseRepository } from '../repositories/course.repository';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { UpdateCourseDto } from '../dtos/update-course.dto';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';
import { Prisma } from '@prisma/client';
import { CloudinaryService } from '@/infrastructure/storage/cloudinary/cloudinary.service';

@Injectable()
export class CourseService {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createCourse(
    userId: string,
    data: CreateCourseDto,
    thumbnail?: Express.Multer.File,
  ) {
    const slug = this.generateSlug(data.title);
    const isSlugAvailable = await this.courseRepository.isSlugAvailable(slug);

    if (!isSlugAvailable) {
      throw new BadRequestException(
        'Course title already exists or slug is taken',
      );
    }

    let thumbnailUrl: string | undefined = undefined;
    if (thumbnail) {
      const uploadResult = await this.cloudinaryService.uploadImage(thumbnail);
      thumbnailUrl = uploadResult?.url;
    }

    // Convert string 'true'/'false' values if they come from formData
    const isPublishedValue = data.is_published as any;
    const isPublished =
      isPublishedValue === 'true' || isPublishedValue === true;
    const difficultyLevel = data.difficulty_level || 'EASY';
    const priceValue = data.price as any;
    const priceRaw =
      typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue || 0;
    const price = isNaN(priceRaw) ? 0 : priceRaw;

    return this.courseRepository.create({
      ...data,
      slug,
      creator_id: userId,
      thumbnail_url: thumbnailUrl || data.thumbnail_url || null,
      is_published: isPublished,
      difficulty_level: difficultyLevel,
      price: isNaN(price) ? 0 : price,
    });
  }

  async findAll(query: PaginationQueryDto, search?: string) {
    let where: Prisma.CourseWhereInput = {};
    if (search) {
      where = {
        OR: [{ title: { contains: search, mode: 'insensitive' } }],
      };
    }
    return this.courseRepository.paginateWithRelations(query, where);
  }

  async findOne(id: string) {
    const course = await this.courseRepository.findWithRelations(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async update(
    id: string,
    data: UpdateCourseDto,
    thumbnail?: Express.Multer.File,
  ) {
    let slug: string | undefined = undefined;
    if (data.title) {
      slug = this.generateSlug(data.title);
      const isSlugAvailable = await this.courseRepository.isSlugAvailable(
        slug,
        id,
      );
      if (!isSlugAvailable) {
        throw new BadRequestException('Course title already exists');
      }
    }

    let thumbnailUrl: string | undefined = undefined;
    if (thumbnail) {
      const uploadResult = await this.cloudinaryService.uploadImage(thumbnail);
      thumbnailUrl = uploadResult?.url;
    }

    // Convert string 'true'/'false' values if they come from formData
    const updatePayload: any = { ...data };

    if (data.is_published !== undefined) {
      const isPublishedValue = data.is_published as any;
      updatePayload.is_published =
        isPublishedValue === 'true' || isPublishedValue === true;
    }
    if (data.price !== undefined) {
      const priceValue = data.price as any;
      const priceRaw =
        typeof priceValue === 'string' ? parseFloat(priceValue) : priceValue;
      updatePayload.price = isNaN(priceRaw) ? 0 : priceRaw;
    }
    if (thumbnailUrl) {
      updatePayload.thumbnail_url = thumbnailUrl;
    }

    return this.courseRepository.update(
      { id },
      {
        ...updatePayload,
        ...(slug ? { slug } : {}),
      },
    );
  }

  async remove(id: string) {
    return this.courseRepository.delete({ id });
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

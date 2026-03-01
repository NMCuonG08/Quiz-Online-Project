import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CourseRepository } from '../repositories/course.repository';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { UpdateCourseDto } from '../dtos/update-course.dto';

@Injectable()
export class CourseService {
  constructor(private readonly courseRepository: CourseRepository) {}

  async createCourse(userId: string, data: CreateCourseDto) {
    const slug = this.generateSlug(data.title);
    const isSlugAvailable = await this.courseRepository.isSlugAvailable(slug);
    
    if (!isSlugAvailable) {
      throw new BadRequestException('Course title already exists or slug is taken');
    }

    return this.courseRepository.create({
      ...data,
      slug,
      creator_id: userId,
    });
  }

  async findAll() {
    return this.courseRepository.findMany();
  }

  async findOne(id: string) {
    const course = await this.courseRepository.findWithRelations(id);
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async update(id: string, data: UpdateCourseDto) {
    let slug: string | undefined = undefined;
    if (data.title) {
      slug = this.generateSlug(data.title);
      const isSlugAvailable = await this.courseRepository.isSlugAvailable(slug, id);
      if (!isSlugAvailable) {
        throw new BadRequestException('Course title already exists');
      }
    }

    return this.courseRepository.update({ id }, {
      ...data,
      ...(slug ? { slug } : {}),
    });
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

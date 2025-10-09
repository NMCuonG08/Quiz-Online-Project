import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { Category } from '@prisma/client';

@Injectable()
export class CategoryService extends BaseService {
  async createCategory(
    createCategoryDto: CreateCategoryDto,
    iconFile?: Express.Multer.File,
  ): Promise<Category> {
    const category = await this.categoryRepository.findByName(
      createCategoryDto.name,
    );

    if (category) {
      throw new BadRequestException('Category already exists');
    }

    let iconUrl: string | undefined;
    if (iconFile) {
      const uploaded = await this.cloudinaryService.uploadImage(iconFile);
      iconUrl = uploaded?.url;
    }

    const { iconFile: _iconFile, ...rest } = createCategoryDto as any;
    void _iconFile;

    const newCategory = await this.categoryRepository.create({
      ...rest,
      ...(iconUrl ? { icon_url: iconUrl } : {}),
    });

    // Invalidate cache khi tạo category mới
    await this.redisService.del('categories:all');

    return newCategory;
  }

  async findAllCategories() {
    const cacheKey = 'categories:all';

    // Thử lấy từ cache trước
    const cachedCategories = await this.redisService.get(cacheKey);
    if (cachedCategories) {
      return cachedCategories;
    }

    // Nếu không có trong cache, query từ database
    const categories = await this.categoryRepository.findMany();

    // Cache kết quả với TTL 5 phút (300 giây)
    await this.redisService.set(cacheKey, categories, 300);

    return categories;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findFirst({ slug });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async updateCategory(
    id: string,
    updateDto: UpdateCategoryDto,
    iconFile?: Express.Multer.File,
  ): Promise<Category> {
    const existing = await this.categoryRepository.findUnique({ id });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    let iconUrl: string | undefined;
    if (iconFile) {
      const uploaded = await this.cloudinaryService.uploadImage(iconFile);
      iconUrl = uploaded?.url;
    }

    const { iconFile: _iconFile, ...rest } = updateDto as any;
    void _iconFile;

    const updated = await this.categoryRepository.update(
      { id },
      {
        ...rest,
        ...(iconUrl ? { icon_url: iconUrl } : {}),
      },
    );

    // Invalidate cache after update
    await this.redisService.del('categories:all');

    return updated;
  }
}

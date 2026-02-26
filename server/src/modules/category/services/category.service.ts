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

    const { iconFile: _iconFile, ...rest } =
      createCategoryDto as unknown as Record<string, unknown>;
    void _iconFile;

    const newCategory = await this.categoryRepository.create({
      ...rest,
      ...(iconUrl ? { icon_url: iconUrl } : {}),
    });

    // Invalidate cache via event
    await this.eventRepository.emit('CategoryCacheInvalidated', {
      keys: 'categories:all',
    });

    const withParent = await this.categoryRepository.findByIdWithParent(
      newCategory.id,
    );
    return {
      ...(withParent as unknown as Category),
      parent_name:
        (withParent as unknown as { parent?: { name?: string } }).parent
          ?.name || null,
    } as unknown as Category;
  }

  async findAllCategories(): Promise<(Category & { parent_name: string | null })[]> {
    const cacheKey = 'categories:all';
    console.log('Fetching categories...');
    const message = 'Lấy toàn bộ categories thành công';

    
    // Thử lấy từ cache trước
    const cachedCategories = await this.redisService.get(cacheKey);
    if (cachedCategories) {
      return cachedCategories as (Category & { parent_name: string | null })[];
    }

    // Nếu không có trong cache, query từ database
    const categories = await this.categoryRepository.findCategories();

    const mapped = categories.map((c) => ({
      ...(c as unknown as Category),
      parent_name:
        (c as unknown as { parent?: { name?: string } }).parent?.name || null,
    }));

    // Cache kết quả với TTL 5 phút (300 giây)
    await this.redisService.set(cacheKey, mapped, 300);

    return mapped;
  }

  async getCategoryBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findBySlugWithParent(slug);
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return {
      ...(category as unknown as Category),
      parent_name:
        (category as unknown as { parent?: { name?: string } }).parent?.name ||
        null,
    } as unknown as Category;
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

    const { iconFile: _iconFile, ...rest } = updateDto as unknown as Record<
      string,
      unknown
    >;
    void _iconFile;

    await this.categoryRepository.update(
      { id },
      {
        ...rest,
        ...(iconUrl ? { icon_url: iconUrl } : {}),
      },
    );

    // Invalidate cache after update via event
    await this.eventRepository.emit('CategoryCacheInvalidated', {
      keys: 'categories:all',
    });

    const withParent = await this.categoryRepository.findByIdWithParent(id);
    return {
      ...(withParent as unknown as Category),
      parent_name:
        (withParent as unknown as { parent?: { name?: string } }).parent
          ?.name || null,
    } as unknown as Category;
  }

  async deleteCategory(id: string): Promise<string> {
    const existingCategory = await this.categoryRepository.findUnique({ id });
    if (!existingCategory) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.delete({ id });
    return 'Category deleted successfully';
  }
}

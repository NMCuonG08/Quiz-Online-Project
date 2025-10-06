import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
import { CreateCategoryDto } from '../dtos/category.dto';

@Injectable()
export class CategoryService extends BaseService {
  async createCategory(createCategoryDto: CreateCategoryDto) {
    const category = await this.categoryRepository.findByName(
      createCategoryDto.name,
    );

    if (category) {
      throw new BadRequestException('Category already exists');
    }

    const newCategory = await this.categoryRepository.create(createCategoryDto);

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

  async getCategoryBySlug(slug: string) {
    const category = await this.categoryRepository.findFirst({ slug });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }
}

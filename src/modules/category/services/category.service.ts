import { BadRequestException, Injectable } from '@nestjs/common';
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

    return this.categoryRepository.create(createCategoryDto);
  }

  async findAllCategories() {
    return this.categoryRepository.findMany();
  }
}

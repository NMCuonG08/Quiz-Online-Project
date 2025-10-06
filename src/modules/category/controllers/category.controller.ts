import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dtos/category.dto';
import { Authenticated } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
import { AuthGuard } from '@/common/guards/auth.guard';

@Controller('/api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(createCategoryDto);
  }

  @Get()
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  findAllCategories() {
    return this.categoryService.findAllCategories();
  }

  @Get('slug/:slug')
  getCategoryBySlug(@Param('slug') slug: string) {
    return this.categoryService.getCategoryBySlug(slug);
  }
}

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Patch,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { Authenticated } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Category } from '@prisma/client';

@Controller('/api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: 'Create category with optional icon upload' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('icon'))
  @Post()
  createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() icon?: Express.Multer.File,
  ): Promise<Category> {
    return this.categoryService.createCategory(
      createCategoryDto,
      icon,
    ) as unknown as Promise<Category>;
  }

  @Get()
  findAllCategories() {
    return this.categoryService.findAllCategories();
  }

  @Get('slug/:slug')
  getCategoryBySlug(@Param('slug') slug: string) {
    return this.categoryService.getCategoryBySlug(slug);
  }

  @ApiOperation({ summary: 'Update category with optional icon upload' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('icon'))
  @Patch(':id')
  updateCategory(
    @Param('id') id: string,
    @Body() updateDto: UpdateCategoryDto,
    @UploadedFile() icon?: Express.Multer.File,
  ): Promise<Category> {
    return (
      this.categoryService.updateCategory as (
        id: string,
        updateDto: UpdateCategoryDto,
        iconFile?: Express.Multer.File,
      ) => Promise<Category>
    )(id, updateDto, icon);
  }
}

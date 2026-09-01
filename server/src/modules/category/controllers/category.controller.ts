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
  Delete,
} from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto, UpdateCategoryDto } from '../dtos/category.dto';
import { Authenticated } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
import { AuthGuard } from '@/common/guards/auth.guard';
import { ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Category } from '@prisma/client';
import { Auth } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';
import { AiIdempotencyInterceptor } from '@/common/interceptors/ai-idempotency.interceptor';

@Controller('/api/categories')
@UseInterceptors(AiIdempotencyInterceptor)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: 'Create category with optional icon upload' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('iconFile'))
  @Post()
  @UseGuards(AuthGuard)
  @Authenticated({ admin: true })
  createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() iconFile?: Express.Multer.File,
  ): Promise<Category> {
    return this.categoryService.createCategory(
      createCategoryDto,
      iconFile,
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
  @UseGuards(AuthGuard)
  @Authenticated({ admin: true })
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

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ admin: true })
  @ApiOperation({ summary: 'Delete a category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted category',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  deleteCategory(@Param('id') id: string): Promise<string> {
    return this.categoryService.deleteCategory(id);
  }
}

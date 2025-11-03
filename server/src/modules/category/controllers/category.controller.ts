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

@Controller('/api/categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @ApiOperation({ summary: 'Create category with optional icon upload' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('iconFile'))
  @Post()
  createCategory(
    @Body() createCategoryDto: CreateCategoryDto,
    @UploadedFile() iconFile?: Express.Multer.File,
  ): Promise<Category> {
    return this.categoryService.createCategory(
      createCategoryDto,
      iconFile,
    ) as unknown as Promise<Category>;
  }

  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  @Get()
  findAllCategories(@Auth() auth: AuthDto) {
    return this.categoryService.findAllCategories(auth.user.id);
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

  @Delete(':id')
  // @UseGuards(AuthGuard)
  // @Authenticated({ permission: Permission.AdminUserDelete })
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

import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Query,
  Delete,
  Patch,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuizService } from '../services/quiz.service';
import { CreateQuizDto } from '../dtos/create-quiz.dto';
import { ApiOperation, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { PaginatedResponseDto } from '@/common/dtos/responses/base.response';
import { QuizPaginationQueryDto } from '../dtos/quiz-pagination.dto';

import { Permission } from '@/common/enums/permisson';
import { Authenticated, AuthGuard, Auth } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto/base-auth.dto';
import { QuizResponseDto } from '../dtos/quiz-response.dto';
import { UpdateQuizDto } from '../dtos/update-quiz.dto';

@Controller('/api/quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  // @UseGuards(AuthGuard)
  // @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({ summary: 'Get all quizzes with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved paginated quizzes',
  })
  async getQuizzes(
    @Query() paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    return this.quizService.getQuizzes(paginationQuery);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get quizzes created by the current user' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved my quizzes',
  })
  async getMyQuizzes(
    @Auth() auth: AuthDto,
    @Query() paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    const creatorId = auth.user.id;
    return this.quizService.getQuizzesByCreator(creatorId, paginationQuery);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a quiz by slug' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved quiz by slug',
  })
  async getQuizBySlug(@Param('slug') slug: string): Promise<QuizResponseDto> {
    return this.quizService.getQuizBySlug(slug);
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get a quiz by id' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved quiz by id',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found',
  })
  async getQuizById(@Param('id') id: string): Promise<QuizResponseDto> {
    return this.quizService.getQuizById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizUpdate })
  @ApiOperation({ summary: 'Update a quiz by id' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiResponse({
    status: 200,
    description: 'Successfully updated quiz by id',
  })
  @ApiResponse({
    status: 400,
    description: 'Slug already exists',
  })
  async updateQuiz(
    @Param('id') id: string,
    @Body() quiz: UpdateQuizDto,
    @Auth() auth: AuthDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ): Promise<QuizResponseDto> {
    const creatorId = auth.user.id;
    return await this.quizService.updateQuiz(id, quiz, creatorId, thumbnail);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Get quizzes by category with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved paginated quizzes by category',
  })
  async getQuizzesByCategory(
    @Param('categoryId') categoryId: string,
    @Query() paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    console.log(categoryId);
    return this.quizService.getQuizzesByCategory(categoryId, paginationQuery);
  }

  @Get('recently-published')
  @ApiOperation({ summary: 'Get recently published quizzes' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved recently published quizzes',
  })
  async getRecentlyPublishedQuizzes(
    @Query() paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    return this.quizService.getRecentlyPublishedQuizzes(paginationQuery);
  }

  @Get('best-rated')
  @ApiOperation({ summary: 'Get best rated quizzes' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved best rated quizzes',
  })
  async getBestRatedQuizzes(
    @Query() paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    return this.quizService.getBestRatedQuizzes(paginationQuery);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular quizzes' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved popular quizzes',
  })
  async getPopularQuizzes(
    @Query() paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    return this.quizService.getPopularQuizzes(paginationQuery);
  }

  @Get('easy')
  @ApiOperation({ summary: 'Get easy quizzes' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved easy quizzes',
  })
  async getEasyQuizzes(
    @Query() paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    return this.quizService.getEasyQuizzes(paginationQuery);
  }

  @Get('hard')
  @ApiOperation({ summary: 'Get hard quizzes' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved hard quizzes',
  })
  async getHardQuizzes(
    @Query() paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    return this.quizService.getHardQuizzes(paginationQuery);
  }

  @Get('difficulty/:difficulty')
  @ApiOperation({ summary: 'Get quizzes by difficulty level' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved quizzes by difficulty',
  })
  async getQuizzesByDifficulty(
    @Param('difficulty') difficulty: 'easy' | 'medium' | 'hard',
    @Query() paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    return this.quizService.getQuizzesByDifficulty(difficulty, paginationQuery);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search quizzes with filters' })
  @ApiResponse({
    status: 200,
    description: 'Successfully searched quizzes',
  })
  async searchQuizzes(
    @Query() paginationQuery: QuizPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuizResponseDto>> {
    return this.quizService.searchQuizzes(paginationQuery);
  }

  @ApiOperation({
    summary: 'Create a new quiz with optional thumbnail upload',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizCreate })
  @ApiResponse({
    status: 201,
    description: 'Successfully created quiz',
  })
  @ApiResponse({
    status: 400,
    description: 'Slug already exists',
  })
  @Post()
  async createQuiz(
    @Body() quiz: CreateQuizDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
    @Auth() auth?: AuthDto,
  ) {
    const creatorId = auth?.user?.id;
    console.log(creatorId);
    return await this.quizService.createQuiz(quiz, thumbnail, creatorId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizDelete })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted quiz',
  })
  async deleteQuiz(@Param('id') id: string, @Auth() auth: AuthDto) {
    const creatorId = auth.user.id;
    return this.quizService.remove(id, creatorId);
  }
}

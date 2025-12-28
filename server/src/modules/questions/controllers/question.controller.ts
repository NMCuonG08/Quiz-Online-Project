import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiConsumes,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { QuestionService } from '../services/question.service';
import { CreateQuestionDto } from '../dtos/create-question.dto';
import { UpdateQuestionDto } from '../dtos/update-question.dto';
import { QuestionPaginationQueryDto } from '../dtos/question-pagination.dto';
import { QuestionResponseDto } from '../dtos/question-response.dto';
import { PaginatedResponseDto } from '@/common/dtos/responses/base.response';
import { Permission } from '@/common/enums/permisson';
import { Authenticated, AuthGuard } from '@/common/guards/auth.guard';

@ApiTags('Questions')
@Controller('/api/questions')
export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all questions with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved paginated questions',
    type: PaginatedResponseDto<QuestionResponseDto>,
  })
  async getQuestions(
    @Query() paginationQuery: QuestionPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuestionResponseDto>> {
    return this.questionService.getQuestions(paginationQuery);
  }

  @Get('quiz/:quizId')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({ summary: 'Get questions by quiz ID with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved paginated questions by quiz',
    type: PaginatedResponseDto<QuestionResponseDto>,
  })
  async getQuestionsByQuiz(
    @Param('quizId') quizId: string,
    @Query() paginationQuery: QuestionPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuestionResponseDto>> {
    return this.questionService.getQuestionsByQuiz(quizId, paginationQuery);
  }

  @Get('quiz/:quizId/public')
  @ApiOperation({ summary: 'Get public questions by quiz ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved questions for public view',
    type: [QuestionResponseDto],
  })
  async getPublicQuestionsByQuiz(
    @Param('quizId') quizId: string,
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.getQuestionsByQuizId(quizId);
  }

  @Get('quiz/slug/:slug/public')
  @ApiOperation({ summary: 'Get public questions by quiz slug' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved questions by quiz slug for public view',
    type: [QuestionResponseDto],
  })
  async getPublicQuestionsByQuizSlug(
    @Param('slug') slug: string,
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.getQuestionsByQuizId(slug);
  }

  @Get('quiz/:quizId/all')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({ summary: 'Get all questions by quiz ID (no pagination)' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all questions by quiz',
    type: [QuestionResponseDto],
  })
  async getAllQuestionsByQuiz(
    @Param('quizId') quizId: string,
  ): Promise<QuestionResponseDto[]> {
    return this.questionService.getQuestionsByQuizId(quizId);
  }

  @Get('slug/:slug')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({ summary: 'Get a question by slug' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved question by slug',
    type: QuestionResponseDto,
  })
  async getQuestionBySlug(
    @Param('slug') slug: string,
  ): Promise<QuestionResponseDto> {
    return this.questionService.getQuestionBySlug(slug);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({ summary: 'Get a question by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved question by ID',
    type: QuestionResponseDto,
  })
  async getQuestionById(@Param('id') id: string): Promise<QuestionResponseDto> {
    return this.questionService.getQuestionById(id);
  }

  @Post()
  // @UseGuards(AuthGuard)
  // @Authenticated({ permission: Permission.QuizCreate })
  @ApiOperation({ summary: 'Create a new question with optional media upload' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('media'))
  @ApiResponse({
    status: 201,
    description: 'Successfully created question',
    type: QuestionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or slug already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found',
  })
  async createQuestion(
    @Body() question: CreateQuestionDto,
    @UploadedFile() media?: Express.Multer.File,
  ): Promise<QuestionResponseDto> {
    return this.questionService.createQuestion(question, media);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizUpdate })
  @ApiOperation({ summary: 'Update a question by ID' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('media'))
  @ApiResponse({
    status: 200,
    description: 'Successfully updated question',
    type: QuestionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or slug already exists',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async updateQuestion(
    @Param('id') id: string,
    @Body() question: UpdateQuestionDto,
    @UploadedFile() media?: Express.Multer.File,
  ): Promise<QuestionResponseDto> {
    return this.questionService.updateQuestion(id, question, media);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizDelete })
  @ApiOperation({ summary: 'Delete a question by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted question',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async deleteQuestion(@Param('id') id: string): Promise<void> {
    return this.questionService.deleteQuestion(id);
  }

  @Post(':id/duplicate')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizCreate })
  @ApiOperation({ summary: 'Duplicate a question' })
  @ApiResponse({
    status: 201,
    description: 'Successfully duplicated question',
    type: QuestionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async duplicateQuestion(
    @Param('id') id: string,
    @Body() body?: { newQuizId?: string },
  ): Promise<QuestionResponseDto> {
    return this.questionService.duplicateQuestion(id, body?.newQuizId);
  }

  @Patch('quiz/:quizId/reorder')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizUpdate })
  @ApiOperation({ summary: 'Reorder questions in a quiz' })
  @ApiResponse({
    status: 200,
    description: 'Successfully reordered questions',
  })
  @ApiResponse({
    status: 404,
    description: 'Quiz not found',
  })
  async reorderQuestions(
    @Param('quizId') quizId: string,
    @Body() body: { questionOrders: { id: string; sort_order: number }[] },
  ): Promise<void> {
    return this.questionService.reorderQuestions(quizId, body.questionOrders);
  }
}

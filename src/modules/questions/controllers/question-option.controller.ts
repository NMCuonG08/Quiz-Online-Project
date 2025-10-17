import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuestionOptionService } from '../services/question-option.service';
import { CreateQuestionOptionDto } from '../dtos/create-question-option.dto';
import { UpdateQuestionOptionDto } from '../dtos/update-question-option.dto';
import { QuestionOptionPaginationQueryDto } from '../dtos/question-option-pagination.dto';
import { QuestionOptionResponseDto } from '../dtos/question-option-response.dto';
import { PaginatedResponseDto } from '@/common/dtos/responses/base.response';
import { Permission } from '@/common/enums/permisson';
import { Authenticated, AuthGuard } from '@/common/guards/auth.guard';

@ApiTags('Question Options')
@Controller('/api/question-options')
export class QuestionOptionController {
  constructor(private readonly questionOptionService: QuestionOptionService) {}

  @Get()
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({ summary: 'Get all question options with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved paginated question options',
    type: PaginatedResponseDto<QuestionOptionResponseDto>,
  })
  async getQuestionOptions(
    @Query() paginationQuery: QuestionOptionPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuestionOptionResponseDto>> {
    return this.questionOptionService.getQuestionOptions(paginationQuery);
  }

  @Get('question/:questionId')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({
    summary: 'Get question options by question ID with pagination',
  })
  @ApiResponse({
    status: 200,
    description:
      'Successfully retrieved paginated question options by question',
    type: PaginatedResponseDto<QuestionOptionResponseDto>,
  })
  async getQuestionOptionsByQuestion(
    @Param('questionId') questionId: string,
    @Query() paginationQuery: QuestionOptionPaginationQueryDto,
  ): Promise<PaginatedResponseDto<QuestionOptionResponseDto>> {
    return this.questionOptionService.getQuestionOptionsByQuestion(
      questionId,
      paginationQuery,
    );
  }

  @Get('question/:questionId/all')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({
    summary: 'Get all question options by question ID (no pagination)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved all question options by question',
    type: [QuestionOptionResponseDto],
  })
  async getAllQuestionOptionsByQuestion(
    @Param('questionId') questionId: string,
  ): Promise<QuestionOptionResponseDto[]> {
    return this.questionOptionService.getQuestionOptionsByQuestionId(
      questionId,
    );
  }

  @Get('question/:questionId/correct')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({ summary: 'Get correct question options by question ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved correct question options by question',
    type: [QuestionOptionResponseDto],
  })
  async getCorrectQuestionOptionsByQuestion(
    @Param('questionId') questionId: string,
  ): Promise<QuestionOptionResponseDto[]> {
    return this.questionOptionService.getCorrectOptionsByQuestionId(questionId);
  }

  @Get('question/:questionId/stats')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({ summary: 'Get question option statistics by question ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved question option statistics',
  })
  async getQuestionOptionStats(@Param('questionId') questionId: string) {
    return this.questionOptionService.getQuestionOptionStats(questionId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  @ApiOperation({ summary: 'Get a question option by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved question option by ID',
    type: QuestionOptionResponseDto,
  })
  async getQuestionOptionById(
    @Param('id') id: string,
  ): Promise<QuestionOptionResponseDto> {
    return this.questionOptionService.getQuestionOptionById(id);
  }

  @Post()
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizCreate })
  @ApiOperation({ summary: 'Create a new question option' })
  @ApiResponse({
    status: 201,
    description: 'Successfully created question option',
    type: QuestionOptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async createQuestionOption(
    @Body() option: CreateQuestionOptionDto,
  ): Promise<QuestionOptionResponseDto> {
    return this.questionOptionService.createQuestionOption(option);
  }

  @Post('question/:questionId/bulk')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizCreate })
  @ApiOperation({ summary: 'Bulk create question options for a question' })
  @ApiResponse({
    status: 201,
    description: 'Successfully bulk created question options',
    type: [QuestionOptionResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async bulkCreateQuestionOptions(
    @Param('questionId') questionId: string,
    @Body() body: { options: Omit<CreateQuestionOptionDto, 'question_id'>[] },
  ): Promise<QuestionOptionResponseDto[]> {
    return this.questionOptionService.bulkCreateQuestionOptions(
      questionId,
      body.options,
    );
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizUpdate })
  @ApiOperation({ summary: 'Update a question option by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully updated question option',
    type: QuestionOptionResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Question option not found',
  })
  async updateQuestionOption(
    @Param('id') id: string,
    @Body() option: UpdateQuestionOptionDto,
  ): Promise<QuestionOptionResponseDto> {
    return this.questionOptionService.updateQuestionOption(id, option);
  }

  @Patch('question/:questionId/bulk')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizUpdate })
  @ApiOperation({ summary: 'Bulk update question options for a question' })
  @ApiResponse({
    status: 200,
    description: 'Successfully bulk updated question options',
    type: [QuestionOptionResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async bulkUpdateQuestionOptions(
    @Param('questionId') questionId: string,
    @Body() body: { options: { id: string; data: UpdateQuestionOptionDto }[] },
  ): Promise<QuestionOptionResponseDto[]> {
    return this.questionOptionService.bulkUpdateQuestionOptions(
      questionId,
      body.options,
    );
  }

  @Patch('question/:questionId/reorder')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizUpdate })
  @ApiOperation({ summary: 'Reorder question options in a question' })
  @ApiResponse({
    status: 200,
    description: 'Successfully reordered question options',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async reorderQuestionOptions(
    @Param('questionId') questionId: string,
    @Body() body: { optionOrders: { id: string; sort_order: number }[] },
  ): Promise<void> {
    return this.questionOptionService.reorderQuestionOptions(
      questionId,
      body.optionOrders,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizDelete })
  @ApiOperation({ summary: 'Delete a question option by ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted question option',
  })
  @ApiResponse({
    status: 404,
    description: 'Question option not found',
  })
  async deleteQuestionOption(@Param('id') id: string): Promise<void> {
    return this.questionOptionService.deleteQuestionOption(id);
  }

  @Delete('question/:questionId/all')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizDelete })
  @ApiOperation({ summary: 'Delete all question options by question ID' })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted all question options',
  })
  @ApiResponse({
    status: 404,
    description: 'Question not found',
  })
  async deleteAllQuestionOptionsByQuestion(
    @Param('questionId') questionId: string,
  ): Promise<void> {
    return this.questionOptionService.deleteAllOptionsByQuestionId(questionId);
  }
}

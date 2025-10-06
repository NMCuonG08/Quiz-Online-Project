import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { QuizService } from '../services/quiz.service';
import { CreateQuizDto } from '../dtos/create-quiz.dto';
import { ApiOperation, ApiConsumes } from '@nestjs/swagger';

import { Permission } from '@/common/enums/permisson';
import { Authenticated, AuthGuard } from '@/common/guards/auth.guard';

@Controller('/api/quizzes')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizRead })
  async getQuizzes() {
    return this.quizService.getQuizzes();
  }

  @Get('category/:categoryId')
  async getQuizzesByCategory(@Param('categoryId') categoryId: string) {
    console.log(categoryId);
    return this.quizService.getQuizzesByCategory(categoryId);
  }

  @ApiOperation({
    summary: 'Create a new quiz with optional thumbnail upload',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  @Post()
  async createQuiz(
    @Body() quiz: CreateQuizDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    return await this.quizService.createQuiz(quiz, thumbnail);
  }
}

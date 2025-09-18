import { Controller, Get } from '@nestjs/common';
import { QuizService } from '../services/quiz.service';

@Controller('api/quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Get()
  async getQuizzes() {
    return this.quizService.getQuizzes();
  }
}

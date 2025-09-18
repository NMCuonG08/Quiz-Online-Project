import { Injectable } from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';

@Injectable()
export class QuizService extends BaseService {
  async getQuizzes() {
    return this.quizRepository.findMany();
  }
}

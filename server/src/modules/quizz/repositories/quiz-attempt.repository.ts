import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { QuizAttempt } from '@prisma/client';

@Injectable()
export class QuizAttemptRepository extends BaseRepository<QuizAttempt> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.quizAttempt;
  }

  async findByQuizAndUser(
    quizId: string,
    userId: string,
    attemptNumber: number,
  ) {
    return await this.prisma.quizAttempt.findUnique({
      where: {
        quiz_id_user_id_attempt_number: {
          quiz_id: quizId,
          user_id: userId,
          attempt_number: attemptNumber,
        },
      },
    });
  }
}

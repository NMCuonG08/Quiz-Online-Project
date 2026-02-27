import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { QuizRating } from '@prisma/client';

@Injectable()
export class RatingRepository extends BaseRepository<QuizRating> {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.quizRating;
  }
}

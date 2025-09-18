import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { BaseRepository } from '@/common/base/base.repository';
import { Quiz } from '@prisma/client';

@Injectable()
export class QuizRepository extends BaseRepository<Quiz> {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  protected get model() {
    return this.prisma.quiz;
  }
}

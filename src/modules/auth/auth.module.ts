import { Module } from '@nestjs/common';
import { BaseRepository } from '@/common/base/base.repository';
import { BaseModule } from '@/common/base/base.module';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { QuizModule } from '@/modules/quizz/quiz.module';
import { CategoryModule } from '@/modules/category/category.module';

@Module({
  imports: [BaseModule, QuizModule, CategoryModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    { provide: BaseRepository, useExisting: UserRepository },
  ],
  exports: [AuthService],
})
export class AuthModule {}

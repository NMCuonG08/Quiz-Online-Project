import { forwardRef, Module, Global } from '@nestjs/common';
import { BaseRepository } from '@/common/base/base.repository';
import { BaseModule } from '@/common/base/base.module';
import { CategoryModule } from '@/modules/category/category.module';
import { CloudinaryModule } from '@/infrastructure/storage/cloudinary/cloudinary.module';
import { QuizController } from './controllers/quiz.controller';
import { QuizSessionController } from './controllers/quiz-session.controller';
import { QuizService } from './services/quiz.service';
import { QuizSessionService } from './services/quiz-session.service';
import { QuizRepository } from './repositories/quiz.repository';
import { QuizAttemptRepository } from './repositories/quiz-attempt.repository';

@Global()
@Module({
  imports: [BaseModule, CloudinaryModule, forwardRef(() => CategoryModule)],
  controllers: [QuizController, QuizSessionController],
  providers: [
    QuizService,
    QuizSessionService,
    QuizAttemptRepository,
    { provide: BaseRepository, useExisting: QuizRepository },
  ],
  exports: [QuizService, QuizSessionService, QuizAttemptRepository],
})
export class QuizModule {}

import { Module, forwardRef } from '@nestjs/common';
import { CategoryController } from './controllers/category.controller';
import { CategoryService } from './services/category.service';
import { BaseModule } from '@/common/base/base.module';
import { BaseRepository } from '@/common/base/base.repository';
import { QuizModule } from '@/modules/quizz/quiz.module';
import { CategoryRepository } from './repositories/category.repository';

@Module({
  imports: [BaseModule, forwardRef(() => QuizModule)],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    { provide: BaseRepository, useExisting: CategoryRepository },
  ],
  exports: [CategoryService],
})
export class CategoryModule {}

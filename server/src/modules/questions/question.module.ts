import { forwardRef, Module } from '@nestjs/common';
import { QuestionController } from './controllers/question.controller';
import { QuestionOptionController } from './controllers/question-option.controller';
import { QuestionService } from './services/question.service';
import { QuestionOptionService } from './services/question-option.service';
import { QuestionRepository } from './repositories/question.repository';
import { QuestionOptionRepository } from './repositories/question-option.repository';
import { BaseModule } from '@/common/base/base.module';

@Module({
  imports: [forwardRef(() => BaseModule)],
  controllers: [QuestionController, QuestionOptionController],
  providers: [
    QuestionService,
    QuestionOptionService,
    QuestionRepository,
    QuestionOptionRepository,
  ],
  exports: [
    QuestionService,
    QuestionOptionService,
    QuestionRepository,
    QuestionOptionRepository,
  ],
})
export class QuestionModule {}

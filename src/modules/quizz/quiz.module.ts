import { forwardRef, Module, Global } from '@nestjs/common';
import { BaseRepository } from '@/common/base/base.repository';
import { BaseModule } from '@/common/base/base.module';
import { UserModule } from '../user/user.module';
import { CategoryModule } from '@/modules/category/category.module';
import { CloudinaryModule } from '@/infrastructure/storage/cloudinary/cloudinary.module';
import { QuizController } from './controllers/quiz.controller';
import { QuizService } from './services/quiz.service';
import { QuizRepository } from './repositories/quiz.repository';

@Global()
@Module({
  imports: [
    BaseModule,
    CloudinaryModule,
    forwardRef(() => UserModule),
    forwardRef(() => CategoryModule),
  ],
  controllers: [QuizController],
  providers: [
    QuizService,
    { provide: BaseRepository, useExisting: QuizRepository },
  ],
  exports: [QuizService],
})
export class QuizModule {}

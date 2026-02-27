import { Module } from '@nestjs/common';
import { FeedbackController } from './controllers/feedback.controller';
import { FeedbackService } from './services/feedback.service';
import { RatingRepository } from './repositories/rating.repository';
import { BaseModule } from '@/common/base/base.module';

@Module({
  imports: [BaseModule],
  controllers: [FeedbackController],
  providers: [FeedbackService, RatingRepository],
  exports: [FeedbackService],
})
export class FeedbackModule {}

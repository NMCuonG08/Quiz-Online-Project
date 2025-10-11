import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { QuizRepository } from '@/modules/quizz/repositories/quiz.repository';
import { CategoryRepository } from '@/modules/category/repositories/category.repository';
import { CloudinaryModule } from '@/infrastructure/storage/cloudinary/cloudinary.module';
import { CloudinaryService } from '@/infrastructure/storage/cloudinary/cloudinary.service';
import { JobRepository } from '@/common/repositories/job.repository';
import { EventRepository } from '@/common/repositories/event.repository';
import { LoggingRepository } from '@/common/repositories/logging.repository';
import { RedisService } from '@/infrastructure/cache/redis/redis.service';
import { RedisModule } from '@/infrastructure/cache/redis/redis.module';
import { GuardsModule } from '../guards/guards.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { EmailRepository } from '../repositories/email.repository';
import { NotificationRepository } from '@/modules/notification/repositories/notification.repository';
import { QuestionModule } from '@/modules/questions/question.module';
import { QuestionRepository } from '@/modules/questions/repositories/question.repository';
import { QuestionOptionRepository } from '@/modules/questions/repositories/question-option.repository';
@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
    RedisModule,
    forwardRef(() => QuestionModule),
    GuardsModule,

    forwardRef(() => AuthModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    UserRepository,
    QuizRepository,
    CategoryRepository,
    CloudinaryService,
    JobRepository,
    EventRepository,
    LoggingRepository,
    EmailRepository,
    RedisService,
    NotificationRepository,
    QuestionRepository,
    QuestionOptionRepository,
  ],
  exports: [
    PrismaModule,
    JwtModule,
    GuardsModule,
    UserRepository,
    QuizRepository,
    CategoryRepository,
    CloudinaryService,
    JobRepository,
    EventRepository,
    LoggingRepository,
    EmailRepository,
    NotificationRepository,
    QuestionRepository,
    QuestionOptionRepository,
  ],
})
export class BaseModule {}

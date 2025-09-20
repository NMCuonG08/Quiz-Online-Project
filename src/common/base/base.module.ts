import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    PrismaModule,
    CloudinaryModule,
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
  ],
  exports: [
    PrismaModule,
    JwtModule,
    UserRepository,
    QuizRepository,
    CategoryRepository,
    CloudinaryService,
    JobRepository,
    EventRepository,
    LoggingRepository,
  ],
})
export class BaseModule {}

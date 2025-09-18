import { forwardRef, Module } from '@nestjs/common';
import { BaseRepository } from '@/common/base/base.repository';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { UserModule } from '../user/user.module';
import { QuizController } from './controllers/quiz.controller';
import { QuizService } from './services/quiz.service';
import { QuizRepository } from './repositories/quiz.repository';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserRepository } from '@/modules/user/repositories/user.repository';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UserModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [QuizController],
  providers: [
    QuizService,
    QuizRepository,
    UserRepository,
    { provide: BaseRepository, useExisting: QuizRepository },
  ],
  exports: [QuizService, QuizRepository],
})
export class QuizModule {}

import { CloudinaryService } from '@/infrastructure/storage/cloudinary/cloudinary.service';
import { Injectable } from '@nestjs/common';
import { LoggingRepository } from '@/common/repositories/logging.repository';
import { CryptoRepository } from '@/common/repositories/crypto.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { QuizRepository } from '@/modules/quizz/repositories/quiz.repository';
import { CategoryRepository } from '@/modules/category/repositories/category.repository';
import { JobRepository } from '@/common/repositories/job.repository';
import { RedisService } from '@/infrastructure/cache/redis/redis.service';
import { AuthCacheService } from '@/modules/auth/services/auth-cache.service';
import { EmailRepository } from '../repositories/email.repository';
import { EventRepository } from '../repositories/event.repository';
import { NotificationRepository } from '@/modules/notification/repositories/notification.repository';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { QuestionRepository } from '@/modules/questions/repositories/question.repository';
import { QuestionOptionRepository } from '@/modules/questions/repositories/question-option.repository';
import { RoomRepository } from '@/modules/room-play/repositories/room.repository';

@Injectable()
export abstract class BaseService {
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly configService: ConfigService,
    protected readonly logger: LoggingRepository,
    protected readonly userRepository: UserRepository,
    protected readonly quizRepository: QuizRepository,
    protected readonly cryptoRepository: CryptoRepository,
    protected readonly categoryRepository: CategoryRepository,
    protected readonly cloudinaryService: CloudinaryService,
    protected readonly jobRepository: JobRepository,
    protected readonly redisService: RedisService,
    protected readonly authCacheService: AuthCacheService,
    protected readonly emailRepository: EmailRepository,
    protected readonly eventRepository: EventRepository,
    protected readonly notificationRepository: NotificationRepository,
    protected readonly roomRepository: RoomRepository,
    protected readonly prisma: PrismaService,
    protected readonly questionRepository: QuestionRepository,
    protected readonly questionOptionRepository: QuestionOptionRepository,
  ) {}
}

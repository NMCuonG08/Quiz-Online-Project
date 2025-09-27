import { CloudinaryService } from '@/infrastructure/storage/cloudinary/cloudinary.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseRepository } from './base.repository';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';
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

@Injectable()
export abstract class BaseService {
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly configService: ConfigService,
    protected readonly repository: BaseRepository,
    protected readonly logger: LoggingRepository,
    protected readonly userRepository: UserRepository,
    protected readonly quizRepository: QuizRepository,
    protected readonly cryptoRepository: CryptoRepository,
    protected readonly categoryRepository: CategoryRepository,
    protected readonly cloudinaryService: CloudinaryService,
    protected readonly jobRepository: JobRepository,
    protected readonly redisService: RedisService,
    protected readonly authCacheService: AuthCacheService,
  ) {}

  async findAll(paginationDto: PaginationQueryDto) {
    return await this.repository.paginate(paginationDto);
  }

  async findOne(id: string) {
    const entity = await this.repository.findUnique({ id });
    if (!entity) {
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  async create(createDto: unknown) {
    return await this.repository.create(createDto);
  }

  async update(id: string, updateDto: unknown) {
    await this.findOne(id); // Check if exists
    return await this.repository.update({ id }, updateDto);
  }

  async remove(id: string) {
    await this.findOne(id); // Check if exists
    return await this.repository.delete({ id });
  }
}

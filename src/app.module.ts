import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CommonRepositoriesModule } from './common/repositories/common-repositories.module';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './common/guards/auth.guard';
import { QuizModule } from './modules/quizz/quiz.module';
import { CategoryModule } from './modules/category/category.module';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from './common/enums';
import { RedisModule } from './infrastructure/cache/redis/redis.module';
import { JobRepository } from './common/repositories/job.repository';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [configuration],
    }),
    // Import RedisModule trước để đảm bảo RedisService được khởi tạo
    RedisModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisConfig = configService.get<{
          url?: string;
          host: string;
          port: number;
          password?: string;
          db: number;
          tls?: boolean;
          cluster?: {
            enabled: boolean;
            nodes: Array<{ host: string; port: number }>;
            dnsLookup: boolean;
          };
        }>('redis');

        if (!redisConfig) {
          throw new Error('Redis configuration not found');
        }

        // Check if cluster is enabled
        if (
          redisConfig.cluster?.enabled &&
          redisConfig.cluster.nodes.length > 0
        ) {
          return {
            connection: {
              host: redisConfig.cluster.nodes[0].host,
              port: redisConfig.cluster.nodes[0].port,
              password: redisConfig.password,
              db: redisConfig.db,
              tls: redisConfig.tls ? {} : undefined,
            },
            defaultJobOptions: {
              attempts: 3,
              removeOnComplete: true,
              removeOnFail: false,
            },
          };
        }

        // Single Redis instance
        return {
          connection: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            db: redisConfig.db,
            tls: redisConfig.tls ? {} : undefined,
          },
          defaultJobOptions: {
            attempts: 3,
            removeOnComplete: true,
            removeOnFail: false,
          },
        };
      },
      inject: [ConfigService],
    }),
    // Register all queues from configuration
    ...Object.values(QueueName).map((queueName) =>
      BullModule.registerQueue({
        name: queueName,
      }),
    ),
    CommonRepositoriesModule,
    PrismaModule,
    AuthModule,
    UserModule,
    QuizModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JobRepository,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}

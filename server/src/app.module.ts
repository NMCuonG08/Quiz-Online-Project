import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CommonRepositoriesModule } from './common/repositories/common-repositories.module';
import { GuardsModule } from './common/guards/guards.module';
import { QuizModule } from './modules/quizz/quiz.module';
import { CategoryModule } from './modules/category/category.module';
import { QuestionModule } from './modules/questions/question.module';
import { BullModule } from '@nestjs/bullmq';
import { QueueName } from './common/enums';
import { RedisModule } from './infrastructure/cache/redis/redis.module';
import { JobRepository } from './common/repositories/job.repository';
import configuration from './config/configuration';
import { NotificationModule } from './modules/notification/notification.module';
import { WebSocketModule } from './common/websocket/websocket.module';
// import { NotificationService } from './modules/notification/services/notification.service';
import { RoomPlayModule } from './modules/room-play/room-play.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { CourseModule } from './modules/courses/course.module';
import { FriendshipModule } from './modules/friendships/friendships.module';
import { CommunityModule } from './modules/community/community.module';

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

        // Nếu có REDIS_URL, ưu tiên dùng URL
        const url = configService.get<string>('REDIS_URL');
        if (url) {
          const wantTls = redisConfig.tls;
          if (wantTls && /^rediss:\/\//i.test(url)) {
            const urlObj = new URL(url);
            const host = urlObj.hostname;

            return {
              connection: {
                url,
                tls: {
                  rejectUnauthorized: false,
                  servername: host,
                },
                connectTimeout: 10000,
                maxRetriesPerRequest: 3,
                enableReadyCheck: false,
              },
              defaultJobOptions: {
                attempts: 3,
                removeOnComplete: true,
                removeOnFail: false,
              },
            };
          }

          return {
            connection: {
              url,
              connectTimeout: 10000,
              maxRetriesPerRequest: 3,
              enableReadyCheck: false,
            },
            defaultJobOptions: {
              attempts: 3,
              removeOnComplete: true,
              removeOnFail: false,
            },
          };
        }

        // Check if cluster is enabled
        if (
          redisConfig.cluster?.enabled &&
          redisConfig.cluster.nodes.length > 0
        ) {
          const tlsConfig = redisConfig.tls
            ? {
                rejectUnauthorized: false,
                servername: redisConfig.cluster.nodes[0].host,
              }
            : undefined;

          return {
            connection: {
              host: redisConfig.cluster.nodes[0].host,
              port: redisConfig.cluster.nodes[0].port,
              password: redisConfig.password,
              db: redisConfig.db,
              tls: tlsConfig,
              connectTimeout: 10000,
              maxRetriesPerRequest: 3,
              enableReadyCheck: false,
            },
            defaultJobOptions: {
              attempts: 3,
              removeOnComplete: true,
              removeOnFail: false,
            },
          };
        }

        // Single Redis instance
        const tlsConfig = redisConfig.tls
          ? {
              rejectUnauthorized: false,
              servername: redisConfig.host,
            }
          : undefined;

        return {
          connection: {
            host: redisConfig.host,
            port: redisConfig.port,
            password: redisConfig.password,
            db: redisConfig.db,
            tls: tlsConfig,
            connectTimeout: 10000,
            maxRetriesPerRequest: 3,
            enableReadyCheck: false,
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
    NotificationModule,
    PrismaModule,
    GuardsModule,
    AuthModule,
    UserModule,
    QuizModule,
    CategoryModule,
    QuestionModule,
    RoomPlayModule,
    WebSocketModule,
    FeedbackModule,
    CourseModule,
    FriendshipModule,
    CommunityModule,
  ],
  controllers: [AppController],
  providers: [AppService, JobRepository],
})
export class AppModule {}

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { Expose } from './prisma.interface';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get('DATABASE_URL'),
        },
      },
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('Database disconnected');
  }

  expose<T>(item: T): Expose<T> {
    if (!item) return {} as T;
    if (item as any as Partial<User>) (item as any).hasPassword = true;
    // delete ((item as any) as Partial<User>);
    // delete ((item as any) as Partial<User>).twoFactorSecret;
    // delete ((item as any) as Partial<Session>).token;
    // delete ((item as any) as Partial<Email>).emailSafe;
    // delete ((item as any) as Partial<ApprovedSubnet>).subnet;
    return item;
  }
}

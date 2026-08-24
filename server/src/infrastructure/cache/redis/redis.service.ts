import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    // Không auto-connect, để BullModule quản lý connection
    this.logger.log('RedisService initialized (no auto-connect)');
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private getRedisConfig(): string {
    // Chỉ sử dụng REDIS_URL từ environment variable
    const url = this.configService.get<string>('REDIS_URL');
    if (!url) {
      throw new Error('REDIS_URL environment variable is required');
    }

    return url;
  }

  async connect(): Promise<void> {
    if (this.client) {
      this.logger.log('Redis client already connected');
      return;
    }

    this.logger.log('Attempting to connect to Redis...');

    const config = this.getRedisConfig();

    this.logger.log('Using configured Redis endpoint');

    // Sử dụng lazyConnect để tránh auto-connect
    // Check if it's a rediss:// URL and add TLS options
    if (/^rediss:\/\//i.test(config)) {
      const urlObj = new URL(config);
      const host = urlObj.hostname;
      this.client = new Redis(config, {
        lazyConnect: true,
        tls: {
          rejectUnauthorized: false,
          servername: host,
        },
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
      });
    } else {
      this.client = new Redis(config, {
        lazyConnect: true,
        connectTimeout: 10000,
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
      });
    }

    this.client.on('error', (err: Error) => {
      this.logger.error(`Redis error: ${err.message}`, err.stack);
    });

    this.client.on('connect', () => this.logger.log('Redis connecting...'));
    this.client.on('ready', () =>
      this.logger.log('Redis connected successfully'),
    );
    this.client.on('reconnecting', () =>
      this.logger.warn('Redis reconnecting...'),
    );
    this.client.on('close', () => this.logger.warn('Redis connection closed'));

    try {
      await this.client.connect();
      this.logger.log('Redis connection established');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to connect to Redis: ${errorMessage}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.quit();
    } finally {
      this.client = null;
    }
  }

  private async ensureClient(): Promise<Redis> {
    if (!this.client) {
      await this.connect();
    }
    return this.client!;
  }

  private withPrefix(key: string): string {
    const prefix = this.configService.get<string>('REDIS_KEY_PREFIX') || 'app:';
    return `${prefix}${key}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const client = await this.ensureClient();
    const raw = await client.get(this.withPrefix(key));
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const client = await this.ensureClient();
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    const fullKey = this.withPrefix(key);
    if (ttlSeconds && ttlSeconds > 0) {
      await client.setex(fullKey, ttlSeconds, payload);
    } else {
      await client.set(fullKey, payload);
    }
  }

  async del(key: string | string[]): Promise<void> {
    const client = await this.ensureClient();
    if (Array.isArray(key)) {
      if (key.length === 0) return;
      const keys = key.map((k) => this.withPrefix(k));
      await client.del(...keys);
      return;
    }
    await client.del(this.withPrefix(key));
  }

  async keys(pattern: string): Promise<string[]> {
    const client = await this.ensureClient();
    const prefix = this.configService.get<string>('REDIS_KEY_PREFIX') || 'app:';
    const keys = await client.keys(`${prefix}${pattern}`);
    return keys;
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length) {
      const client = await this.ensureClient();
      await client.del(...keys);
    }
  }

  async incrementWithTtl(key: string, ttlSeconds: number): Promise<number> {
    const client = await this.ensureClient();
    const fullKey = this.withPrefix(key);
    const count = await client.incr(fullKey);
    if (count === 1 && ttlSeconds > 0) {
      await client.expire(fullKey, ttlSeconds);
    }
    return count;
  }

  async listPushJson(key: string, value: unknown, maxItems: number, ttlSeconds: number): Promise<void> {
    const client = await this.ensureClient();
    const fullKey = this.withPrefix(key);
    const pipeline = client.pipeline();
    pipeline.rpush(fullKey, JSON.stringify(value));
    pipeline.ltrim(fullKey, -Math.max(1, maxItems), -1);
    pipeline.expire(fullKey, ttlSeconds);
    await pipeline.exec();
  }

  async listRangeJson<T>(key: string, start = 0, end = -1): Promise<T[]> {
    const client = await this.ensureClient();
    const values = await client.lrange(this.withPrefix(key), start, end);
    return values.flatMap((value) => {
      try { return [JSON.parse(value) as T]; } catch { return []; }
    });
  }

  async hashSetJson(key: string, field: string, value: unknown, ttlSeconds: number): Promise<void> {
    const client = await this.ensureClient();
    const fullKey = this.withPrefix(key);
    const pipeline = client.pipeline();
    pipeline.hset(fullKey, field, JSON.stringify(value));
    pipeline.expire(fullKey, ttlSeconds);
    await pipeline.exec();
  }

  async hashValuesJson<T>(key: string): Promise<T[]> {
    const client = await this.ensureClient();
    const values = await client.hvals(this.withPrefix(key));
    return values.flatMap((value) => {
      try { return [JSON.parse(value) as T]; } catch { return []; }
    });
  }

  async setIfAbsent(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
    const client = await this.ensureClient();
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    const result = await client.set(
      this.withPrefix(key), payload, 'EX', ttlSeconds, 'NX',
    );
    return result === 'OK';
  }

  async flushNamespace(): Promise<void> {
    const keys = await this.keys('*');
    if (keys.length) {
      const client = await this.ensureClient();
      await client.del(...keys);
    }
  }
}

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';

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

  private getRedisConfig(): string | RedisOptions {
    // Ưu tiên sử dụng REDIS_URL từ environment variable
    const url = this.configService.get<string>('REDIS_URL');
    console.log('REDIS_URL from env:', url);

    if (url) {
      // Nếu người dùng bật REDIS_TLS nhưng URL không phải rediss://, cảnh báo để tránh timeout do sai giao thức
      const wantTls = this.configService.get<boolean>('redis.tls');
      if (wantTls && /^redis:\/\//i.test(url) && !/^rediss:\/\//i.test(url)) {
        this.logger.warn(
          'REDIS_TLS=true nhưng REDIS_URL không phải rediss://. Hãy dùng rediss:// hoặc tắt REDIS_TLS, nếu không có thể lỗi ETIMEDOUT.',
        );
      }
      return url;
    }

    // Fallback về cấu hình từ config object
    const redisConfig = this.configService.get<{
      url?: string;
      host: string;
      port: number;
      username?: string;
      password?: string;
      db: number;
      tls?: boolean;
    }>('redis');

    if (redisConfig?.url) {
      console.log('REDIS_URL from config:', redisConfig.url);
      return redisConfig.url;
    }

    // Build config từ các phần riêng lẻ
    if (!redisConfig) {
      throw new Error('Redis configuration not found');
    }

    const host = redisConfig.host || '127.0.0.1';
    const port = redisConfig.port || 6379;
    const username = redisConfig.username;
    const password = redisConfig.password;
    const db = redisConfig.db ?? 0;
    const tlsEnabled = !!redisConfig.tls;

    return {
      host,
      port,
      username,
      password,
      db,
      // Bật TLS nếu cấu hình yêu cầu. Có thể thêm các option như servername/ca nếu cần.
      tls: tlsEnabled ? {} : undefined,
    };
  }

  async connect(): Promise<void> {
    if (this.client) {
      this.logger.log('Redis client already connected');
      return;
    }

    this.logger.log('Attempting to connect to Redis...');

    const config = this.getRedisConfig();

    this.logger.log(
      `Using Redis config: ${typeof config === 'string' ? config : JSON.stringify(config)}`,
    );

    // ioredis có thể nhận string URL hoặc object config
    // Sử dụng lazyConnect để tránh auto-connect
    if (typeof config === 'string') {
      this.client = new Redis(config, { lazyConnect: true });
    } else {
      this.client = new Redis({
        ...config,
        lazyConnect: true,
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

  async flushNamespace(): Promise<void> {
    const keys = await this.keys('*');
    if (keys.length) {
      const client = await this.ensureClient();
      await client.del(...keys);
    }
  }
}

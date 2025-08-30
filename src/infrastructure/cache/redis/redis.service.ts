import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  private getRedisUrl(): string | null {
    const url = this.configService.get<string>('REDIS_URL');
    console.log('url', url);
    return url || null;
  }

  private buildUrlFromParts(): string {
    const host = this.configService.get<string>('redis.host') || '';
    const port = this.configService.get<number>('redis.port') || 6379;
    const username = this.configService.get<string>('redis.username');
    const password = this.configService.get<string>('redis.password');
    const db = this.configService.get<number>('redis.db') ?? 0;
    const tls = this.configService.get<boolean>('redis.tls') || false;

    const authPart =
      username || password ? `${username || ''}:${password || ''}@` : '';
    const protocol = tls ? 'rediss' : 'redis';
    return `${protocol}://${authPart}${host}:${port}/${db}`;
  }

  private shouldUseTls(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'rediss:';
    } catch {
      return false;
    }
  }

  async connect(): Promise<void> {
    if (this.client) return;

    let url = this.getRedisUrl();
    if (url) {
      try {
        const parsed = new URL(url);
        if (!parsed.hostname) throw new Error('Missing host');
      } catch {
        this.logger.warn(
          'Invalid REDIS_URL provided. Falling back to discrete redis.* config.',
        );
        url = null;
      }
    }
    url = url || this.buildUrlFromParts();

    const useTls = this.shouldUseTls(url);
    const parsed = new URL(url);

    const socketConfig: any = {
      reconnectStrategy: (retries) => Math.min(retries * 50, 2000),
    };

    if (useTls) {
      socketConfig.tls = true;
      socketConfig.rejectUnauthorized = false; // tránh lỗi cert self-signed
      socketConfig.servername = parsed.hostname; // bắt buộc cho Redis Cloud
    }

    const clientConfig: any = {
      url,
      socket: socketConfig,
    };

    this.client = createClient(clientConfig);

    this.client.on('error', (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Redis error: ${message}`, stack);
    });
    this.client.on('connect', () => this.logger.log('Redis connecting...'));
    this.client.on('ready', () => this.logger.log('Redis connected'));
    this.client.on('reconnecting', () =>
      this.logger.warn('Redis reconnecting...'),
    );
    this.client.on('end', () => this.logger.warn('Redis connection closed'));

    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.quit();
    } finally {
      this.client = null;
    }
  }

  private ensureClient(): RedisClientType {
    if (!this.client) {
      throw new Error('Redis client not connected');
    }
    return this.client;
  }

  private withPrefix(key: string): string {
    const prefix = this.configService.get<string>('REDIS_KEY_PREFIX') || 'app:';
    return `${prefix}${key}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.ensureClient().get(this.withPrefix(key));
    if (raw == null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const payload = typeof value === 'string' ? value : JSON.stringify(value);
    const fullKey = this.withPrefix(key);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.ensureClient().set(fullKey, payload, { EX: ttlSeconds });
    } else {
      await this.ensureClient().set(fullKey, payload);
    }
  }

  async del(key: string | string[]): Promise<void> {
    const client = this.ensureClient();
    if (Array.isArray(key)) {
      if (key.length === 0) return;
      const keys = key.map((k) => this.withPrefix(k));
      await client.del(keys);
      return;
    }
    await client.del(this.withPrefix(key));
  }

  async keys(pattern: string): Promise<string[]> {
    const client = this.ensureClient();
    const prefix =
      this.configService.get<string>('REDIS_KEY_PREFIX') || 'app:';
    const iter = client.scanIterator({ MATCH: `${prefix}${pattern}` });
    const results: string[] = [];
    for await (const key of iter) {
      results.push(String(key));
    }
    return results;
  }

  async delByPattern(pattern: string): Promise<void> {
    const keys = await this.keys(pattern);
    if (keys.length) {
      await this.ensureClient().del(keys);
    }
  }

  async flushNamespace(): Promise<void> {
    const keys = await this.keys('*');
    if (keys.length) {
      await this.ensureClient().del(keys);
    }
  }
}

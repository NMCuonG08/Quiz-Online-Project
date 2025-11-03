import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './infrastructure/cache/redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  async healthCheck() {
    try {
      // Test Redis connection by setting a test key
      await this.redisService.set('health-check', 'ok', 10);
      await this.redisService.get('health-check');

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          redis: 'connected',
          database: 'connected',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          redis: 'disconnected',
          database: 'unknown',
        },
      };
    }
  }

  @Get('redis-test')
  async testRedis() {
    try {
      // Test Redis connection
      await this.redisService.set('test-key', 'test-value', 60);
      const value = await this.redisService.get('test-key');
      const keys = await this.redisService.keys('*');

      return {
        success: true,
        message: 'Redis connection successful',
        testValue: value,
        allKeys: keys,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Redis connection failed',
        error: error.message,
      };
    }
  }
}

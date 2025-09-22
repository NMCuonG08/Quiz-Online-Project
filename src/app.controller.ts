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

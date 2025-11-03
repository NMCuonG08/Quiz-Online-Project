import { Injectable } from '@nestjs/common';
import { LoggingRepository } from './logging.repository';

@Injectable()
export class MockEventRepository {
  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MockEventRepository.name);
  }

  emit(event: string, ...args: any[]): void {
    this.logger.debug(`Event emitted: ${event}`, args);
  }

  setup(): void {
    this.logger.debug('MockEventRepository setup completed');
  }
}

import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { LoggingRepository } from './logging.repository';
import { CryptoRepository } from './crypto.repository';
import { ConfigRepository } from './config.repository';
import { MockEventRepository } from './mock-event.repository';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
      },
    }),
  ],
  providers: [
    LoggingRepository,
    CryptoRepository,
    ConfigRepository,
    MockEventRepository,
  ],
  exports: [
    LoggingRepository,
    CryptoRepository,
    ConfigRepository,
    MockEventRepository,
  ],
})
export class CommonRepositoriesModule {}

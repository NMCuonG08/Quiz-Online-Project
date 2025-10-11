import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { LoggingRepository } from './logging.repository';
import { CryptoRepository } from './crypto.repository';
import { ConfigRepository } from './config.repository';
import { MockEventRepository } from './mock-event.repository';
import { AuthModule } from '@/modules/auth/auth.module';
import { IWorker } from '@/common/constants';
import { projectWorker } from '@/common/enums';

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
    AuthModule,
  ],
  providers: [
    {
      provide: IWorker,
      useValue: projectWorker.Api,
    },
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

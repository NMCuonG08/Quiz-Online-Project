import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { LoggingRepository } from './logging.repository';
import { CryptoRepository } from './crypto.repository';
import { ConfigRepository } from './config.repository';

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
  providers: [LoggingRepository, CryptoRepository, ConfigRepository],
  exports: [LoggingRepository, CryptoRepository, ConfigRepository],
})
export class CommonRepositoriesModule {} 
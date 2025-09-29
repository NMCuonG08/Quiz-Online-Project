import { Module, forwardRef } from '@nestjs/common';
import { BaseRepository } from '@/common/base/base.repository';
import { BaseModule } from '@/common/base/base.module';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';
import { AuthCacheService } from './services/auth-cache.service';
import { GuardsModule } from '@/common/guards/guards.module';

@Module({
  imports: [BaseModule, forwardRef(() => GuardsModule)],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthCacheService,
    UserRepository,
    { provide: BaseRepository, useExisting: UserRepository },
  ],
  exports: [AuthService, AuthCacheService],
})
export class AuthModule {}

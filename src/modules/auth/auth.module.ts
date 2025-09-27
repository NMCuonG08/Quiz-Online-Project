import { Module } from '@nestjs/common';
import { BaseRepository } from '@/common/base/base.repository';
import { BaseModule } from '@/common/base/base.module';
import { UserRepository } from '@/modules/user/repositories/user.repository';
import { AuthService } from './services/auth.service';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [BaseModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    { provide: BaseRepository, useExisting: UserRepository },
  ],
  exports: [AuthService],
})
export class AuthModule {}

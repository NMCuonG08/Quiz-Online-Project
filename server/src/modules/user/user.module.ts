import { Module, forwardRef } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from '@/modules/auth/auth.module';
import { CloudinaryModule } from '@/infrastructure/storage/cloudinary/cloudinary.module';

@Module({
  imports: [forwardRef(() => AuthModule), CloudinaryModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

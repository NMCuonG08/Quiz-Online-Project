import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { PrismaModule } from '@/infrastructure/database/prisma.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}

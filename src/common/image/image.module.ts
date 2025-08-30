import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageRepository } from './image.repository';
import { PrismaService } from '@/infrastructure/database';
import { CloudinaryService } from '@/infrastructure/storage/cloudinary/cloudinary.service';

@Module({
  providers: [ImageService, ImageRepository, PrismaService, CloudinaryService],
  exports: [ImageService],
})
export class ImageModule {}

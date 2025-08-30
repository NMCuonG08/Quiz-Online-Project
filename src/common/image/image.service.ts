// src/features/image/image.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ImageRepository } from './image.repository';
import { CloudinaryService } from '../../infrastructure/storage/cloudinary/cloudinary.service';
import { ExternalServiceException } from '../exceptions';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly imageRepository: ImageRepository,
  ) {}

  async uploadImage(file: Express.Multer.File) {
    try {
      return await this.cloudinaryService.uploadImage(file);
    } catch (error) {
      this.logger.error('Failed to upload image', error);
      throw new ExternalServiceException(
        'Image Service',
        'upload image',
        error as Error,
      );
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    try {
      await this.cloudinaryService.deleteImage(imageId);
    } catch (error) {
      console.warn('Failed to delete image from Cloudinary:', error);
    }
  }

  async getImageUrl(imageId: string): Promise<string | null | undefined> {
    try {
      if (imageId) {
        return await this.cloudinaryService.getImageUrl(imageId);
      }
    } catch (error) {
      console.warn('Failed to get image URL:', error);
      return undefined;
    }
  }

  async getImageById(id: string) {
    return this.imageRepository.findById(id);
  }

  async getImagesByIds(ids: string[]) {
    return this.imageRepository.findByIds(ids);
  }
}

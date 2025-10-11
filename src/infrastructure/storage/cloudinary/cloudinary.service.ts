import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { Image } from '@prisma/client';
import {
  NoFileProvidedException,
  InvalidFileTypeException,
  ExternalServiceException,
} from '@/common/middlewares';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {
    // Configure Cloudinary with environment variables
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<Image | null> {
    if (!file?.buffer) {
      throw new NoFileProvidedException();
    }
    if (!file.mimetype?.startsWith('image/')) {
      throw new InvalidFileTypeException(['image']);
    }

    const folder =
      this.configService.get<string>('CLOUDINARY_FOLDER') ?? 'error';
    const allowedFormats = this.configService
      .get<string>('CLOUDINARY_ALLOWED_FORMATS')
      ?.split(',')
      .map((f) => f.trim().toLowerCase()) ?? [
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
    ];

    let uploadApiResponse: UploadApiResponse | undefined;
    try {
      uploadApiResponse = await new Promise((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            allowed_formats: allowedFormats,
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result)
              return reject(new Error('Upload failed, no result returned'));
            resolve(result);
          },
        );
        upload.end(file.buffer);
      });
    } catch (error) {
      this.logger.error('Cloudinary upload failed', error as Error);
      throw new ExternalServiceException(
        'Cloudinary',
        'upload image',
        error as Error,
      );
    }

    if (!uploadApiResponse) return null;

    try {
      return await this.prismaService.image.create({
        data: {
          url: uploadApiResponse.secure_url,
          publicId: uploadApiResponse.public_id,
          createdAt: new Date(uploadApiResponse.created_at),
        },
      });
    } catch (error) {
      // Rollback the uploaded asset if DB write fails
      try {
        await cloudinary.uploader.destroy(uploadApiResponse.public_id);
      } catch (rollbackError) {
        this.logger.warn(
          `Failed to rollback Cloudinary asset ${uploadApiResponse.public_id}: ${String(rollbackError)}`,
        );
      }
      this.logger.error('Failed to persist image record', error as Error);
      throw new ExternalServiceException(
        'Database',
        'save image record',
        error as Error,
      );
    }
  }

  async deleteImage(imageId: string): Promise<void> {
    const image = await this.prismaService.image.findUnique({
      where: { id: imageId },
      select: { publicId: true },
    });
    if (!image) return;

    try {
      await cloudinary.uploader.destroy(image.publicId);
    } catch (error) {
      this.logger.warn(
        `Failed to delete image from Cloudinary: ${image.publicId}: ${String(error)}`,
      );
    }

    try {
      await this.prismaService.image.delete({ where: { id: imageId } });
    } catch (error) {
      this.logger.warn(
        `Failed to delete image record from DB: ${imageId}: ${String(error)}`,
      );
    }
  }

  async getImageUrl(imageId: string) {
    const image = await this.prismaService.image.findUnique({
      where: {
        id: imageId,
      },
    });
    if (!image) return null;
    return image.url;
  }
}

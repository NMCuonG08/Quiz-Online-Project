import { Injectable } from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
import { CreateQuizDto } from '../dtos/create-quiz.dto';
import { JobName, JobStatus, QueueName } from '@/common/enums';
import { OnJob } from '@/common/decorators';

interface SerializedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: string; // base64 string
  size: number;
}

interface UploadImageJobData {
  id: string;
  image: SerializedFile;
}

@Injectable()
export class QuizService extends BaseService {
  async getQuizzes() {
    return this.quizRepository.findMany();
  }

  async getQuizzesByCategory(categoryId: string) {
    return this.quizRepository.findMany({
      where: { categoryId },
    });
  }

  async createQuiz(quiz: CreateQuizDto, thumbnail?: Express.Multer.File) {
    let thumbnailId: string | undefined;
    const quizData = {
      ...quiz,
      thumbnail_id: thumbnailId || null,
    };
    const createdQuizz = await this.quizRepository.create(quizData);
    console.log('Chuan  bi upload ');

    // Upload thumbnail to Cloudinary if provided
    if (thumbnail) {
      console.log('Co file de upload');
      const serializedFile: SerializedFile = {
        fieldname: thumbnail.fieldname,
        originalname: thumbnail.originalname,
        encoding: thumbnail.encoding,
        mimetype: thumbnail.mimetype,
        buffer: thumbnail.buffer.toString('base64'),
        size: thumbnail.size,
      };

      const jobData: UploadImageJobData = {
        id: createdQuizz.id,
        image: serializedFile,
      };

      await this.jobRepository.queue({
        name: JobName.UploadImage,
        data: jobData as any,
      });
    }

    return createdQuizz;
  }

  @OnJob({ name: JobName.UploadImage, queue: QueueName.ThumbnailGeneration })
  async uploadImage(data: UploadImageJobData) {
    console.log('uploadImage', data);
    const { id, image } = data;

    // Reconstruct the file object properly
    const file: Express.Multer.File = {
      fieldname: image.fieldname,
      originalname: image.originalname,
      encoding: image.encoding,
      mimetype: image.mimetype,
      buffer: Buffer.from(image.buffer, 'base64'),
      size: image.size,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    const uploadResult = await this.cloudinaryService.uploadImage(file);
    const thumbnailId = uploadResult?.id;
    await this.quizRepository.update({ id }, { thumbnail_id: thumbnailId });
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDelete, queue: QueueName.BackgroundTask })
  assetDelete(data: any) {
    // TODO: Implement asset deletion logic
    this.logger.log('AssetDelete job executed', data);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.AssetDeleteCheck, queue: QueueName.BackgroundTask })
  assetDeleteCheck(data: any) {
    // TODO: Implement asset deletion check logic
    this.logger.log('AssetDeleteCheck job executed', data);
    return JobStatus.Success;
  }

  @OnJob({ name: JobName.VersionCheck, queue: QueueName.BackgroundTask })
  versionCheck(data: any) {
    // TODO: Implement version check logic
    this.logger.log('VersionCheck job executed', data);
    return JobStatus.Success;
  }
}

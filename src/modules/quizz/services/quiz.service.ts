import { Injectable } from '@nestjs/common';
import { BaseService } from '@/common/base/base.service';
import { CreateQuizDto } from '../dtos/create-quiz.dto';

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

    // Upload thumbnail to Cloudinary if provided
    if (thumbnail) {
      const uploadResult = await this.cloudinaryService.uploadImage(thumbnail);
      thumbnailId = uploadResult?.id;
    }

    // Create quiz data with thumbnail_id
    const quizData = {
      ...quiz,
      thumbnail_id: thumbnailId || null,
    };

    // Remove the thumbnail field from DTO as it's not part of the database schema
    delete quizData.thumbnail;

    return await this.quizRepository.create(quizData);
  }
}

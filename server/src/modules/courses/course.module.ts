import { Module } from '@nestjs/common';
import { CourseController } from './controllers/course.controller';
import { CourseService } from './services/course.service';
import { CourseRepository } from './repositories/course.repository';

import { GuardsModule } from '@/common/guards/guards.module';
import { CloudinaryModule } from '@/infrastructure/storage/cloudinary/cloudinary.module';

@Module({
  imports: [GuardsModule, CloudinaryModule],
  controllers: [CourseController],
  providers: [CourseService, CourseRepository],
  exports: [CourseService, CourseRepository],
})
export class CourseModule {}

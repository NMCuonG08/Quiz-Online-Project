import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { UpdateCourseDto } from '../dtos/update-course.dto';
import { AuthGuard, Authenticated, Auth } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
import { AuthDto } from '@/modules/auth/dto';

@Controller('/api/courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  @UseGuards(AuthGuard)
  // Assuming create course requires specific permissions, or just logged in
  @Authenticated({ permission: Permission.QuizCreate }) 
  create(@Auth() auth: AuthDto, @Body() createCourseDto: CreateCourseDto) {
    if (!auth.user) {
      throw new Error('User not found in auth token');
    }
    return this.courseService.createCourse(auth.user.id, createCourseDto);
  }

  @Get()
  findAll() {
    return this.courseService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizUpdate })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.courseService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizDelete })
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}

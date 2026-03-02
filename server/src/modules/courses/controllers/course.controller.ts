import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { CourseService } from '../services/course.service';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { UpdateCourseDto } from '../dtos/update-course.dto';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';
import { AuthGuard, Authenticated, Auth } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
import { AuthDto } from '@/modules/auth/dto';

@Controller('/api/courses')
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Post()
  // @UseGuards(AuthGuard)
  // @Authenticated({ permission: Permission.QuizCreate })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  create(
    @Auth() auth: AuthDto,
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    if (!auth.user) {
      throw new Error('User not found in auth token');
    }
    return this.courseService.createCourse(
      auth.user.id,
      createCourseDto,
      thumbnail,
    );
  }

  @Get()
  findAll(
    @Query() paginationDto: PaginationQueryDto,
    @Query('search') search?: string,
  ) {
    return this.courseService.findAll(paginationDto, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.courseService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizUpdate })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('thumbnail'))
  update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ) {
    return this.courseService.update(id, updateCourseDto, thumbnail);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.QuizDelete })
  remove(@Param('id') id: string) {
    return this.courseService.remove(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Auth, Authenticated, AuthGuard } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
import { Query } from '@nestjs/common';
import { AuthDto } from '@/modules/auth/dto';
import { CloudinaryService } from '@/infrastructure/storage/cloudinary/cloudinary.service';

@Controller('/api/user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('test-validation')
  @ApiOperation({
    summary: 'Test validation with detailed error format',
  })
  testValidation(@Body() createUserDto: CreateUserDto) {
    // This will trigger validation and return detailed errors
    return { message: 'Validation passed', data: createUserDto };
  }

  @Get()
  // @UseGuards(AuthGuard)
  // @Authenticated({ permission: Permission.AdminUserRead })
  findAll() {
    return this.userService.findAll();
  }

  @Get('roles')
  // @UseGuards(AuthGuard)
  // @Authenticated({ permission: Permission.AdminUserRead })
  findAllRoles() {
    return this.userService.findAllRoles();
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  getProfile(@Auth() auth: AuthDto) {
    return auth.user;
  }

  @Get('search')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  searchUsers(@Query('q') query: string, @Auth() auth: AuthDto) {
    return this.userService.searchUsers(query, auth.user?.id || '');
  }

  @Get('me/dashboard')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  getDashboard(@Auth() auth: AuthDto) {
    return this.userService.getDashboard(auth.user.id);
  }

  @Patch('me/avatar')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async updateMyAvatar(
    @Auth() auth: AuthDto,
    @UploadedFile() avatar?: Express.Multer.File,
  ) {
    if (!avatar) throw new BadRequestException('Avatar image is required');
    const uploaded = await this.cloudinaryService.uploadImage(avatar);
    if (!uploaded?.url) throw new BadRequestException('Avatar upload failed');
    return this.userService.update(auth.user.id, { avatar: uploaded.url });
  }

  @Patch('me')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  updateMyProfile(@Auth() auth: AuthDto, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(auth.user.id, updateUserDto);
  }

  @Get(':id/profile')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: false })
  getPublicProfile(@Param('id') id: string, @Auth() auth: AuthDto) {
    return this.userService.getPublicProfile(id, auth.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/roles')
  // @UseGuards(AuthGuard)
  // @Authenticated({ permission: Permission.AdminUserUpdate })
  updateRoles(
    @Param('id') id: string,
    @Body('roleIds') roleIds: string[],
  ) {
    return this.userService.updateUserRoles(id, roleIds);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}

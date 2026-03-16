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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { Auth, Authenticated, AuthGuard } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
import { Query } from '@nestjs/common';
import { AuthDto } from '@/modules/auth/dto';

@Controller('/api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
  // @UseGuards(AuthGuard)
  // @Authenticated({ permission: Permission.ActivityRead })
  getProfile(@Auth() auth: AuthDto) {
    return auth.user;
  }

  @Get('search')
  // @UseGuards(AuthGuard)
  // @Authenticated()
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  searchUsers(@Query('q') query: string, @Auth() auth: AuthDto) {
    return this.userService.searchUsers(query, auth.user?.id || '');
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

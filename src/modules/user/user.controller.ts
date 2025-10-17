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
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth, Authenticated, AuthGuard } from '@/common/guards/auth.guard';
import { Permission } from '@/common/enums';
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
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  findAll() {
    return this.userService.findAll();
  }

  @Get('profile')
  @UseGuards(AuthGuard)
  @Authenticated({ permission: Permission.ActivityRead })
  getProfile(@Auth() auth: AuthDto) {
    return auth.user;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}

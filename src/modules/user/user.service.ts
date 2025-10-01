import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { ResourceNotFoundException } from '@/common/exceptions';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { email, username, fullName, password, avatar } = createUserDto;
    return this.prismaService.user.create({
      data: {
        email,
        username: username ?? undefined,
        full_name: fullName ?? undefined,
        password,
        avatar: avatar ?? undefined,
      },
    });
  }

  async findAll() {
    return this.prismaService.user.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });
    if (!user) throw new ResourceNotFoundException('User', id);
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { email, username, fullName, password, avatar } = updateUserDto;
    return this.prismaService.user.update({
      where: { id },
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(username !== undefined ? { username } : {}),
        ...(fullName !== undefined ? { full_name: fullName } : {}),
        ...(password !== undefined ? { password } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
      },
    });
  }

  async remove(id: string) {
    return this.prismaService.user.delete({ where: { id } });
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from '@prisma/client';
import { ResourceNotFoundException } from '@/common/middlewares';
import { EventRepository } from '@/common/repositories/event.repository';

@Injectable()
export class UserService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly eventRepository: EventRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, username, fullName, password, avatar } = createUserDto;
    const created = await this.prismaService.user.create({
      data: {
        email,
        username: username ?? undefined,
        full_name: fullName ?? undefined,
        password,
        avatar: avatar ?? undefined,
      },
    });
    await this.eventRepository.emit('UserCreated', { id: created.id });
    return created;
  }

  async findAll() {
    return this.prismaService.user.findMany({
      orderBy: { created_at: 'desc' },
    });
  }

  async searchUsers(query: string, currentUserId: string) {
    if (!query) return [];
    return this.prismaService.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { full_name: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        avatar: true,
      },
      take: 20,
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
    const updated = await this.prismaService.user.update({
      where: { id },
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(username !== undefined ? { username } : {}),
        ...(fullName !== undefined ? { full_name: fullName } : {}),
        ...(password !== undefined ? { password } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
      },
    });
    await this.eventRepository.emit('UserUpdated', { id });
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.prismaService.user.delete({ where: { id } });
    await this.eventRepository.emit('UserDeleted', { id });
    return deleted;
  }
}

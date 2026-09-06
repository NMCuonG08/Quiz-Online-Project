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
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findAllRoles() {
    return this.prismaService.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async searchUsers(query: string, currentUserId: string) {
    const normalizedQuery = query?.trim().slice(0, 80);
    if (!normalizedQuery) return [];
    const users = await this.prismaService.user.findMany({
      where: {
        id: { not: currentUserId },
        deletedAt: null,
        OR: [
          { full_name: { contains: normalizedQuery, mode: 'insensitive' } },
          { username: { contains: normalizedQuery, mode: 'insensitive' } },
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
    if (!users.length || !currentUserId) return users;
    const relationships = await this.prismaService.friendship.findMany({
      where: {
        OR: users.flatMap((user) => [
          { userId: currentUserId, friendId: user.id },
          { userId: user.id, friendId: currentUserId },
        ]),
      },
      select: { id: true, userId: true, friendId: true, status: true },
    });
    const byUser = new Map<string, { id: string; userId: string; status: string }>();
    relationships.forEach((relationship) => {
      byUser.set(
        relationship.userId === currentUserId ? relationship.friendId : relationship.userId,
        relationship,
      );
    });
    return users.map((user) => {
      const relationship = byUser.get(user.id);
      const status = relationship?.status === 'ACCEPTED'
        ? 'FRIENDS'
        : relationship?.status === 'BLOCKED'
          ? 'BLOCKED'
          : relationship
            ? relationship.userId === currentUserId ? 'OUTGOING_PENDING' : 'INCOMING_PENDING'
            : 'NONE';
      return { ...user, relationshipStatus: status, friendshipId: relationship?.id ?? null };
    });
  }

  async getDashboard(userId: string) {
    const [user, statistics, friendsCount, pendingRequests, inProgress, recentAttempts] =
      await Promise.all([
        this.prismaService.user.findUnique({
          where: { id: userId },
          select: { id: true, username: true, full_name: true, avatar: true, bio: true },
        }),
        this.prismaService.userStatistics.findUnique({ where: { user_id: userId } }),
        this.prismaService.friendship.count({ where: { status: 'ACCEPTED', OR: [{ userId }, { friendId: userId }] } }),
        this.prismaService.friendship.count({ where: { friendId: userId, status: 'PENDING' } }),
        this.prismaService.quizAttempt.count({ where: { user_id: userId, status: 'IN_PROGRESS' } }),
        this.prismaService.quizAttempt.findMany({
          where: { user_id: userId, status: 'COMPLETED' }, orderBy: { completed_at: 'desc' }, take: 5,
          select: { id: true, quiz_id: true, score: true, percentage: true, time_taken: true, completed_at: true,
            quiz: { select: { title: true, slug: true, thumbnail: { select: { url: true } } } } },
        }),
      ]);
    if (!user) throw new ResourceNotFoundException('User', userId);
    let dashboardStatistics = statistics;
    if (!dashboardStatistics) {
      const [aggregate, quizCount] = await Promise.all([
        this.prismaService.quizAttempt.aggregate({ where: { user_id: userId, status: 'COMPLETED' }, _count: { id: true }, _avg: { percentage: true }, _sum: { time_taken: true } }),
        this.prismaService.quizAttempt.findMany({ where: { user_id: userId, status: 'COMPLETED' }, distinct: ['quiz_id'], select: { quiz_id: true } }),
      ]);
      dashboardStatistics = {
        total_quizzes_taken: quizCount.length,
        total_quizzes_created: 0,
        average_score: aggregate._avg.percentage ?? 0,
        total_time_spent: aggregate._sum.time_taken ?? 0,
        streak_days: 0,
      } as any;
    }
    return {
      user,
      statistics: dashboardStatistics,
      social: { friendsCount, pendingRequests, inProgress },
      recentAttempts,
    };
  }

  async getPublicProfile(userId: string, viewerId?: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, full_name: true, avatar: true, bio: true, created_at: true, deletedAt: true },
    });
    if (!user || user.deletedAt) throw new ResourceNotFoundException('User', userId);
    const isSelf = viewerId === userId;
    const relationship = viewerId && !isSelf
      ? await this.prismaService.friendship.findFirst({ where: { OR: [{ userId: viewerId, friendId: userId }, { userId, friendId: viewerId }] }, select: { id: true, status: true, userId: true, friendId: true } })
      : null;
    const isFriend = relationship?.status === 'ACCEPTED';
    const stats = isSelf || isFriend ? await this.prismaService.userStatistics.findUnique({ where: { user_id: userId } }) : null;
    return {
      profile: { id: user.id, username: user.username, full_name: user.full_name, avatar: user.avatar, bio: user.bio, created_at: user.created_at },
      relationship: isSelf ? { status: 'SELF', friendshipId: null } : relationship
        ? { status: relationship.status === 'ACCEPTED' ? 'FRIENDS' : relationship.userId === viewerId ? 'OUTGOING_PENDING' : 'INCOMING_PENDING', friendshipId: relationship.id }
        : { status: 'NONE', friendshipId: null },
      statistics: stats,
    };
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

  async updateUserRoles(id: string, roleIds: string[]) {
    // Check if user exists
    await this.findOne(id);

    // Update user roles
    await this.prismaService.$transaction(async (tx) => {
      // Delete existing roles
      await tx.userRole.deleteMany({
        where: { userId: id },
      });

      // Create new roles
      if (roleIds.length > 0) {
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({
            userId: id,
            roleId,
          })),
        });
      }
    });

    await this.eventRepository.emit('UserRolesUpdated', { id, roleIds });
    return this.findOneWithRoles(id);
  }

  async findOneWithRoles(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
    if (!user) throw new ResourceNotFoundException('User', id);
    return user;
  }

  async remove(id: string) {
    const deleted = await this.prismaService.user.delete({ where: { id } });
    await this.eventRepository.emit('UserDeleted', { id });
    return deleted;
  }
}

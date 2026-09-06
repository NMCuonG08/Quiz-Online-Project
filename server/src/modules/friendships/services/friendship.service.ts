import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@Injectable()
export class FriendshipService {
  constructor(private readonly prisma: PrismaService) {}

  async sendFriendRequest(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new BadRequestException(
        'You cannot send a friend request to yourself',
      );
    }

    const target = await this.prisma.user.findUnique({
      where: { id: friendId },
      select: { id: true, deletedAt: true },
    });
    if (!target || target.deletedAt) {
      throw new NotFoundException('User not found');
    }

    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'PENDING' && existingFriendship.friendId === userId) {
        throw new ConflictException('This user has already sent you a friend request');
      }
      throw new ConflictException('Friendship or request already exists');
    }

    try {
      const friendship = await this.prisma.friendship.create({
        data: { userId, friendId, status: 'PENDING' },
      });
      await this.prisma.notification.create({ data: { user_id: friendId, type: 'SYSTEM', title: 'Lời mời kết bạn mới', message: 'Bạn nhận được một lời mời kết bạn.', data: { kind: 'FRIEND_REQUEST', friendshipId: friendship.id, actorId: userId } } });
      return friendship;
    } catch (error: any) {
      // A concurrent request can win between the read and create. Expose a
      // stable business error instead of leaking a Prisma constraint error.
      if (error?.code === 'P2002') {
        throw new ConflictException('Friendship or request already exists');
      }
      throw error;
    }
  }

  async acceptFriendRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship || friendship.friendId !== userId) {
      throw new NotFoundException('Friend request not found or unauthorized');
    }

    if (friendship.status !== 'PENDING') {
      throw new BadRequestException('Request is not pending');
    }

    // Usually, we can either update status or create a bidirectional loop depending on DB schema design.
    // Our design supports ACCEPTED status to mean users are friends.
    return this.prisma.friendship.updateMany({
      where: { id: friendshipId, friendId: userId, status: 'PENDING' },
      data: { status: 'ACCEPTED' },
    }).then(async (result) => {
      if (result.count !== 1) {
        throw new ConflictException('Friend request is no longer pending');
      }
      const accepted = await this.prisma.friendship.findUnique({ where: { id: friendshipId } });
      if (accepted) {
        await this.prisma.notification.create({ data: { user_id: accepted.userId, type: 'SYSTEM', title: 'Lời mời kết bạn được chấp nhận', message: 'Lời mời kết bạn của bạn đã được chấp nhận.', data: { kind: 'FRIEND_ACCEPTED', friendshipId: accepted.id, actorId: userId } } });
      }
      return accepted;
    });
  }

  async rejectOrCancelRequest(userId: string, friendshipId: string) {
    const friendship = await this.prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    if (friendship.userId !== userId && friendship.friendId !== userId) {
      throw new BadRequestException('Unauthorized action');
    }

    if (friendship.status === 'BLOCKED') {
      throw new BadRequestException('Blocked relationships must be managed through blocking settings');
    }

    return this.prisma.friendship.delete({ where: { id: friendshipId } });
  }

  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [{ userId }, { friendId: userId }],
      },
      include: {
        user: {
          select: { id: true, username: true, full_name: true, avatar: true },
        },
        friend: {
          select: { id: true, username: true, full_name: true, avatar: true },
        },
      },
    });

    // Map to extract friend profile
    return friendships.map((f) => {
      const friend = f.userId === userId ? f.friend : f.user;
      return { friendshipId: f.id, friendsSince: f.updated_at, friend };
    });
  }

  async getPendingRequests(userId: string) {
    return this.prisma.friendship.findMany({
      where: {
        friendId: userId,
        status: 'PENDING',
      },
      include: {
        user: {
          select: { id: true, username: true, full_name: true, avatar: true },
        },
      },
    });
  }

  async getSentRequests(userId: string) {
    return this.prisma.friendship.findMany({
      where: { userId, status: 'PENDING' },
      orderBy: { created_at: 'desc' },
      include: {
        friend: {
          select: { id: true, username: true, full_name: true, avatar: true },
        },
      },
    });
  }

  async getRelationship(userId: string, otherUserId: string) {
    if (userId === otherUserId) return { status: 'SELF', friendshipId: null };
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: otherUserId },
          { userId: otherUserId, friendId: userId },
        ],
      },
      select: { id: true, userId: true, friendId: true, status: true },
    });
    if (!friendship) return { status: 'NONE', friendshipId: null };
    if (friendship.status === 'ACCEPTED') return { status: 'FRIENDS', friendshipId: friendship.id };
    if (friendship.status === 'BLOCKED') return { status: 'BLOCKED', friendshipId: friendship.id };
    return {
      status: friendship.userId === userId ? 'OUTGOING_PENDING' : 'INCOMING_PENDING',
      friendshipId: friendship.id,
    };
  }
}

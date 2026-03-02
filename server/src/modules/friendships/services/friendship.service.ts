import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (existingFriendship) {
      throw new BadRequestException('Friendship or request already exists');
    }

    return this.prisma.friendship.create({
      data: {
        userId,
        friendId,
        status: 'PENDING',
      },
    });
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
    return this.prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'ACCEPTED' },
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

    return this.prisma.friendship.delete({
      where: { id: friendshipId },
    });
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
      if (f.userId === userId) {
        return f.friend;
      }
      return f.user;
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
}

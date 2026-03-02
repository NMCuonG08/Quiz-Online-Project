import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import {
  CreatePostDto,
  CreateCommentDto,
  ToggleLikeDto,
} from '../dtos/community.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  // Posts
  async createPost(userId: string, data: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        userId,
        ...data,
      },
    });
  }

  async getPosts(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    return this.prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, full_name: true, avatar: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.userId !== userId) {
      // Simple auth check for now
      throw new NotFoundException('Post not found or unauthorized');
    }

    return this.prisma.post.delete({ where: { id: postId } });
  }

  // Comments
  async createComment(userId: string, data: CreateCommentDto) {
    return this.prisma.comment.create({
      data: {
        userId,
        postId: data.postId,
        content: data.content,
      },
      include: {
        user: {
          select: { id: true, username: true, full_name: true, avatar: true },
        },
      },
    });
  }

  async getCommentsByPost(postId: string) {
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { created_at: 'asc' },
      include: {
        user: {
          select: { id: true, username: true, full_name: true, avatar: true },
        },
      },
    });
  }

  // Likes
  async toggleLike(userId: string, data: ToggleLikeDto) {
    const existingLike = await this.prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: data.postId,
          userId,
        },
      },
    });

    if (existingLike) {
      await this.prisma.like.delete({
        where: { id: existingLike.id },
      });
      return { liked: false };
    } else {
      await this.prisma.like.create({
        data: {
          postId: data.postId,
          userId,
        },
      });
      return { liked: true };
    }
  }
}

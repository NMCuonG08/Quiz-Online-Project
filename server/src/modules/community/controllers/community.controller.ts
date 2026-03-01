import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommunityService } from '../services/community.service';
import { CreatePostDto, CreateCommentDto, ToggleLikeDto } from '../dtos/community.dto';
import { AuthGuard, Authenticated, Auth } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto';

@Controller('/api/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('posts')
  getPosts(@Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    return this.communityService.getPosts(Number(page), Number(limit));
  }

  @Post('posts')
  @UseGuards(AuthGuard)
  @Authenticated()
  createPost(@Auth() auth: AuthDto, @Body() data: CreatePostDto) {
    if (!auth.user) throw new Error('Unauthorized');
    return this.communityService.createPost(auth.user.id, data);
  }

  @Delete('posts/:id')
  @UseGuards(AuthGuard)
  @Authenticated()
  deletePost(@Auth() auth: AuthDto, @Param('id') postId: string) {
    if (!auth.user) throw new Error('Unauthorized');
    return this.communityService.deletePost(auth.user.id, postId);
  }

  // Comments
  @Get('posts/:id/comments')
  getComments(@Param('id') postId: string) {
    return this.communityService.getCommentsByPost(postId);
  }

  @Post('comments')
  @UseGuards(AuthGuard)
  @Authenticated()
  createComment(@Auth() auth: AuthDto, @Body() data: CreateCommentDto) {
    if (!auth.user) throw new Error('Unauthorized');
    return this.communityService.createComment(auth.user.id, data);
  }

  // Likes
  @Post('likes/toggle')
  @UseGuards(AuthGuard)
  @Authenticated()
  toggleLike(@Auth() auth: AuthDto, @Body() data: ToggleLikeDto) {
    if (!auth.user) throw new Error('Unauthorized');
    return this.communityService.toggleLike(auth.user.id, data);
  }
}

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { FriendshipService } from '../services/friendship.service';
import { SendFriendRequestDto } from '../dtos/friendship.dto';
import { AuthGuard, Authenticated, Auth } from '@/common/guards/auth.guard';
import { AuthDto } from '@/modules/auth/dto';

@Controller('/api/friendships')
@UseGuards(AuthGuard)
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Post('request')
  @Authenticated()
  sendRequest(@Auth() auth: AuthDto, @Body() body: SendFriendRequestDto) {
    if (!auth.user) throw new Error('Unauthorized');
    return this.friendshipService.sendFriendRequest(auth.user.id, body.friendId);
  }

  @Post('accept/:id')
  @Authenticated()
  acceptRequest(@Auth() auth: AuthDto, @Param('id') friendshipId: string) {
    if (!auth.user) throw new Error('Unauthorized');
    return this.friendshipService.acceptFriendRequest(auth.user.id, friendshipId);
  }

  @Delete(':id')
  @Authenticated()
  rejectOrRemove(@Auth() auth: AuthDto, @Param('id') friendshipId: string) {
    if (!auth.user) throw new Error('Unauthorized');
    return this.friendshipService.rejectOrCancelRequest(auth.user.id, friendshipId);
  }

  @Get('friends')
  @Authenticated()
  getFriends(@Auth() auth: AuthDto) {
    if (!auth.user) throw new Error('Unauthorized');
    return this.friendshipService.getFriends(auth.user.id);
  }

  @Get('requests/pending')
  @Authenticated()
  getPendingRequests(@Auth() auth: AuthDto) {
    if (!auth.user) throw new Error('Unauthorized');
    return this.friendshipService.getPendingRequests(auth.user.id);
  }
}

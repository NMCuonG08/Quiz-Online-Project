import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SendFriendRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  friendId: string;
}

export class AcceptFriendRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  friendshipId: string;
}

import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  otherUserId: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  body: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  clientMessageId?: string;

  @IsOptional()
  @IsIn(['TEXT', 'QUIZ_SHARE', 'RESULT_SHARE', 'ROOM_INVITE', 'CHALLENGE', 'SYSTEM'])
  type?: 'TEXT' | 'QUIZ_SHARE' | 'RESULT_SHARE' | 'ROOM_INVITE' | 'CHALLENGE' | 'SYSTEM';
}

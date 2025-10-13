import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class JoinRoomDto {
  @ApiPropertyOptional({ description: 'Password if room is private' })
  @IsOptional()
  @IsString()
  password?: string;
}

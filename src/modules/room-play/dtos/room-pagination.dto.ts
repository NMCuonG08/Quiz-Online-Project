import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';

export class RoomPaginationDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 'OPEN' })
  @IsOptional()
  @IsEnum({ OPEN: 'OPEN', IN_GAME: 'IN_GAME', CLOSED: 'CLOSED' })
  status?: 'OPEN' | 'IN_GAME' | 'CLOSED';

  @ApiPropertyOptional({ example: 'abc123' })
  @IsOptional()
  @IsString()
  room_code?: string;
}

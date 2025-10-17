import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '2a639f98-cf28-4afb-8924-17d4a92c1517' })
  @IsUUID()
  @IsString()
  @IsNotEmpty()
  quiz_id: string;

  @ApiPropertyOptional({ example: 'ROOM123' })
  @IsOptional()
  @IsString()
  room_code?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @ApiPropertyOptional({ example: 'secret' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  max_participants?: number;

  @ApiPropertyOptional({ description: 'Arbitrary JSON settings' })
  @IsOptional()
  settings?: Record<string, unknown>;
}

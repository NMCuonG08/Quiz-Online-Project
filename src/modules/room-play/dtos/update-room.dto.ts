import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpdateRoomDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_private?: boolean;

  @ApiPropertyOptional({ example: 'new-secret' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: 80 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  max_participants?: number;

  @ApiPropertyOptional({ description: 'Arbitrary JSON settings' })
  @IsOptional()
  settings?: Record<string, unknown>;
}

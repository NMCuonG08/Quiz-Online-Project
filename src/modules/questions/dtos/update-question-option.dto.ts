import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateQuestionOptionDto {
  @ApiPropertyOptional({ example: 'Updated Option A' })
  @IsString()
  @IsOptional()
  option_text?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  is_correct?: boolean;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ example: 'Updated explanation' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ example: 'https://example.com/updated-image.jpg' })
  @IsString()
  @IsOptional()
  media_url?: string;
}

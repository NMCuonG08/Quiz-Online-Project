import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';

export class CreateQuestionOptionDto {
  @ApiProperty({ example: '2a639f98-cf28-4afb-8924-17d4a92c1517' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  question_id: string;

  @ApiProperty({ example: 'Option A' })
  @IsString()
  @IsNotEmpty()
  option_text: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_correct: boolean;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  sort_order: number = 0;

  @ApiPropertyOptional({ example: 'This is the correct answer because...' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  media_url?: string;
}

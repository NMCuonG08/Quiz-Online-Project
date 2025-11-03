import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DifficultyLevelEnum, QuizTypeEnumEnum } from '@/common/enums';

export class UpdateQuizDto {
  @ApiPropertyOptional({ example: 'Updated Quiz Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'updated-quiz-slug' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: '2a639f98-cf28-4afb-8924-17d4a92c1517' })
  @IsString()
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: DifficultyLevelEnum.MEDIUM,
    enum: DifficultyLevelEnum,
    description: 'Difficulty level of the quiz',
  })
  @IsEnum(DifficultyLevelEnum)
  @IsOptional()
  difficulty_level?: DifficultyLevelEnum;

  @ApiPropertyOptional({ example: 900 })
  @IsNumber()
  @IsOptional()
  time_limit?: number;

  @ApiPropertyOptional({ example: 3 })
  @IsNumber()
  @IsOptional()
  max_attempts?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsNumber()
  @IsOptional()
  passing_score?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    example: QuizTypeEnumEnum.TRUE_FALSE,
    enum: QuizTypeEnumEnum,
    description: 'Type of quiz',
  })
  @IsEnum(QuizTypeEnumEnum)
  @IsOptional()
  quiz_type?: QuizTypeEnumEnum;

  @ApiPropertyOptional({ example: 'Updated instructions' })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Quiz thumbnail image file',
  })
  @IsOptional()
  thumbnail?: Express.Multer.File;

  @ApiPropertyOptional({
    example: '2024-02-15T10:30:00.000Z',
    description: 'Publication date of the quiz (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'published_at must be a valid ISO 8601 date string' },
  )
  @Transform(({ value }: { value: any }) => {
    if (!value) {
      return undefined;
    }
    // Ensure the value is a valid ISO 8601 string
    const date = new Date(value as string);
    return date.toISOString();
  })
  published_at?: string;
}

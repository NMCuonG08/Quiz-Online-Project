import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DifficultyLevelEnum, QuizTypeEnumEnum } from '@/common/enums';

export class CreateQuizDto {
  @ApiProperty({ example: 'Quiz 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'quiz-1' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: '2a639f98-cf28-4afb-8924-17d4a92c1517' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  category_id: string;

  @ApiProperty({ example: 'Chao' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiPropertyOptional({
    description: 'Populated from authenticated user token',
  })
  @ApiProperty({
    example: DifficultyLevelEnum.EASY,
    enum: DifficultyLevelEnum,
    description: 'Difficulty level of the quiz',
  })
  @IsEnum(DifficultyLevelEnum)
  @IsOptional()
  difficulty_level: DifficultyLevelEnum = DifficultyLevelEnum.EASY;

  @ApiProperty({ example: 600 })
  @IsNumber()
  time_limit: number;

  @ApiProperty({ example: 1 })
  @IsOptional()
  @IsNumber()
  max_attempts: number = 0;

  @ApiProperty({ example: 0 })
  @IsOptional()
  @IsNumber()
  passing_score?: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  is_active: boolean = false;

  @ApiProperty({
    example: QuizTypeEnumEnum.MULTIPLE_CHOICE,
    enum: QuizTypeEnumEnum,
    description: 'Type of quiz',
  })
  @IsEnum(QuizTypeEnumEnum)
  quiz_type: QuizTypeEnumEnum = QuizTypeEnumEnum.MULTIPLE_CHOICE;

  @ApiProperty({ example: 'hello welcome' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Quiz thumbnail image file',
  })
  @IsOptional()
  thumbnail?: Express.Multer.File;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Publication date of the quiz (ISO 8601 format)',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'published_at must be a valid ISO 8601 date string' },
  )
  @Transform(({ value }: { value: any }) => {
    if (!value) {
      return new Date().toISOString();
    }
    // Ensure the value is a valid ISO 8601 string
    const date = new Date(value as string);
    return date.toISOString();
  })
  published_at: string;
}

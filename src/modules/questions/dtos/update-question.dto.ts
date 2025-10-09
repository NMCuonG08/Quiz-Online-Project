import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  QuestionTypeEnum,
  DifficultyLevelEnum,
  MediaTypeEnum,
} from '@/common/enums';

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

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'Updated question text?' })
  @IsString()
  @IsOptional()
  question_text?: string;

  @ApiPropertyOptional({ example: 'updated-question-slug' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    example: QuestionTypeEnum.TRUE_FALSE,
    enum: QuestionTypeEnum,
    description: 'Type of question',
  })
  @IsEnum(QuestionTypeEnum)
  @IsOptional()
  question_type?: QuestionTypeEnum;

  @ApiPropertyOptional({ example: 2.0 })
  @IsNumber()
  @IsOptional()
  points?: number;

  @ApiPropertyOptional({ example: 45 })
  @IsNumber()
  @IsOptional()
  time_limit?: number;

  @ApiPropertyOptional({ example: 'Updated explanation text' })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ example: '2a639f98-cf28-4afb-8924-17d4a92c1517' })
  @IsString()
  @IsOptional()
  @IsUUID()
  media_id?: string;

  @ApiPropertyOptional({
    example: MediaTypeEnum.VIDEO,
    enum: MediaTypeEnum,
    description: 'Type of media',
  })
  @IsEnum(MediaTypeEnum)
  @IsOptional()
  media_type?: MediaTypeEnum;

  @ApiPropertyOptional({
    example: DifficultyLevelEnum.HARD,
    enum: DifficultyLevelEnum,
    description: 'Difficulty level of the question',
  })
  @IsEnum(DifficultyLevelEnum)
  @IsOptional()
  difficulty_level?: DifficultyLevelEnum;

  @ApiPropertyOptional({ example: 2 })
  @IsNumber()
  @IsOptional()
  sort_order?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  is_required?: boolean;

  @ApiPropertyOptional({
    example: { shuffle_options: false, show_explanation: true },
    description: 'Additional settings for the question',
  })
  @IsOptional()
  settings?: Record<string, any>;

  @ApiPropertyOptional({
    type: [UpdateQuestionOptionDto],
    description: 'Options for multiple choice questions',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateQuestionOptionDto)
  @IsOptional()
  options?: UpdateQuestionOptionDto[];
}

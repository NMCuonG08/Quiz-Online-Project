import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import {
  QuestionTypeEnum,
  DifficultyLevelEnum,
  MediaTypeEnum,
} from '@/common/enums';

export class CreateQuestionDto {
  @ApiProperty({ example: '2a639f98-cf28-4afb-8924-17d4a92c1517' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  quiz_id: string;

  @ApiProperty({ example: 'What is the capital of France?' })
  @IsString()
  @IsNotEmpty()
  question_text: string;

  @ApiProperty({ example: 'what-is-the-capital-of-france' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({
    example: QuestionTypeEnum.MULTIPLE_CHOICE,
    enum: QuestionTypeEnum,
    description: 'Type of question',
  })
  @IsEnum(QuestionTypeEnum)
  question_type: QuestionTypeEnum;

  @ApiProperty({ example: 1.0 })
  @IsNumber()
  @IsOptional()
  points: number = 1.0;

  @ApiPropertyOptional({ example: 30 })
  @IsNumber()
  @IsOptional()
  time_limit?: number;

  @ApiPropertyOptional({
    example: 'Paris is the capital and largest city of France.',
  })
  @IsString()
  @IsOptional()
  explanation?: string;

  @ApiPropertyOptional({ example: '2a639f98-cf28-4afb-8924-17d4a92c1517' })
  @IsString()
  @IsOptional()
  @IsUUID()
  media_id?: string;

  @ApiPropertyOptional({
    example: MediaTypeEnum.IMAGE,
    enum: MediaTypeEnum,
    description: 'Type of media',
  })
  @IsEnum(MediaTypeEnum)
  @IsOptional()
  media_type?: MediaTypeEnum;

  @ApiPropertyOptional({
    example: DifficultyLevelEnum.MEDIUM,
    enum: DifficultyLevelEnum,
    description: 'Difficulty level of the question',
  })
  @IsEnum(DifficultyLevelEnum)
  @IsOptional()
  difficulty_level: DifficultyLevelEnum = DifficultyLevelEnum.MEDIUM;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @IsOptional()
  sort_order: number = 0;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  is_required: boolean = true;

  @ApiPropertyOptional({
    example: { shuffle_options: true, show_explanation: false },
    description: 'Additional settings for the question',
  })
  @IsOptional()
  settings?: Record<string, any>;
}

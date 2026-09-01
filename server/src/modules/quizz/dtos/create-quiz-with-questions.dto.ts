import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  DifficultyLevelEnum,
  QuestionTypeEnum,
} from '@/common/enums';
import { CreateQuizDto } from './create-quiz.dto';

class CreateQuizQuestionOptionDto {
  @IsString()
  @IsNotEmpty()
  option_text: string;

  @IsBoolean()
  is_correct: boolean;

  @IsInt()
  @Min(0)
  sort_order = 0;

  @IsOptional()
  @IsString()
  explanation?: string;
}

class CreateQuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  question_text: string;

  @IsEnum(QuestionTypeEnum)
  question_type: QuestionTypeEnum;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionOptionDto)
  options: CreateQuizQuestionOptionDto[];

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  points = 1;

  @IsOptional()
  @IsNumber()
  @Min(0)
  time_limit?: number;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsOptional()
  @IsEnum(DifficultyLevelEnum)
  difficulty_level?: DifficultyLevelEnum;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order = 0;

  @IsOptional()
  @IsBoolean()
  is_required = true;
}

export class CreateQuizWithQuestionsDto extends CreateQuizDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateQuizQuestionDto)
  questions: CreateQuizQuestionDto[];
}

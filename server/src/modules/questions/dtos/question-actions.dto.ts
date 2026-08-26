import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuestionOrderDto {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(0)
  sort_order: number;
}

export class ReorderQuestionsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuestionOrderDto)
  questionOrders: QuestionOrderDto[];
}

export class DuplicateQuestionDto {
  @IsOptional()
  @IsUUID()
  newQuizId?: string;
}

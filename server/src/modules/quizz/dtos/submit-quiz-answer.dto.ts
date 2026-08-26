import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class SubmitQuizAnswerDto {
  @IsUUID()
  question_id: string;

  @IsOptional()
  @IsUUID()
  selected_option_id?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selected_option_ids?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(10_000)
  text_answer?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  time_spent?: number;
}

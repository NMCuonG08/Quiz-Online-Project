import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  Min,
  IsString,
  IsIn,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionPaginationQueryDto {
  @ApiProperty({
    description: 'Page number',
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    minimum: 1,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    description: 'Field to sort by',
    required: false,
    example: 'sort_order',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    required: false,
    default: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({
    description: 'Filter by quiz ID',
    required: false,
    example: '2a639f98-cf28-4afb-8924-17d4a92c1517',
  })
  @IsOptional()
  @IsUUID()
  quiz_id?: string;

  @ApiProperty({
    description: 'Filter by question type',
    required: false,
    example: 'MULTIPLE_CHOICE',
  })
  @IsOptional()
  @IsString()
  question_type?: string;

  @ApiProperty({
    description: 'Filter by difficulty level',
    required: false,
    example: 'MEDIUM',
  })
  @IsOptional()
  @IsString()
  difficulty_level?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsNumber,
  Min,
  IsString,
  IsIn,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuizSortCriteria } from '@/common/enums';

export class QuizPaginationQueryDto {
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
    enum: QuizSortCriteria,
    example: QuizSortCriteria.RECENTLY_PUBLISHED,
  })
  @IsOptional()
  @IsEnum(QuizSortCriteria)
  sortBy?: QuizSortCriteria;

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
    description: 'Filter by difficulty level',
    required: false,
    example: 'easy',
    enum: ['easy', 'medium', 'hard'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';

  @ApiProperty({
    description: 'Search by quiz title or description',
    required: false,
    example: 'javascript quiz',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by minimum rating',
    required: false,
    minimum: 0,
    maximum: 5,
    example: 4.0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minRating?: number;
}

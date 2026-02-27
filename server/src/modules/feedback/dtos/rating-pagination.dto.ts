import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/common/dtos/responses/base.response';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RatingPaginationQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by Quiz ID' })
  @IsOptional()
  @IsString()
  quiz_id?: string;
}

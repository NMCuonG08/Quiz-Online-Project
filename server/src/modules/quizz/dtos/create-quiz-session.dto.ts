import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateQuizSessionDto {
  @ApiProperty({ description: 'Quiz ID', required: false })
  @IsOptional()
  @IsUUID()
  quiz_id?: string;

  @ApiProperty({ description: 'Quiz slug', required: false })
  @IsOptional()
  @IsString()
  quiz_slug?: string;
}

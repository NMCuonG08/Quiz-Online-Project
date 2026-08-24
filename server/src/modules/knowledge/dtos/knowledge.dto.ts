import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { KnowledgeSourceStatus, KnowledgeVisibility } from '@prisma/client';

export class CreateKnowledgeSourceDto {
  @IsString()
  @MinLength(3)
  @MaxLength(240)
  title: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source_type?: string = 'MANUAL';

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2000)
  source_uri?: string;

  @IsOptional()
  @IsEnum(KnowledgeVisibility)
  visibility?: KnowledgeVisibility = KnowledgeVisibility.PRIVATE;
}

export class UpdateKnowledgeSourceDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(240)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200000)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  source_type?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2000)
  source_uri?: string;

  @IsOptional()
  @IsEnum(KnowledgeVisibility)
  visibility?: KnowledgeVisibility;
}

export class ImportKnowledgeSourceDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(240)
  title?: string;

  @IsOptional()
  @IsEnum(KnowledgeVisibility)
  visibility?: KnowledgeVisibility = KnowledgeVisibility.PRIVATE;
}

export class ImportKnowledgeUrlDto extends ImportKnowledgeSourceDto {
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2000)
  url: string;
}

export class ReviewKnowledgeSourceDto {
  @IsEnum(KnowledgeSourceStatus)
  status: KnowledgeSourceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rejection_reason?: string;
}

export class SearchKnowledgeDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  query: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 5;
}

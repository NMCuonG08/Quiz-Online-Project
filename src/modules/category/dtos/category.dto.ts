import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Category 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Description of the category' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Category icon image file',
  })
  @IsOptional()
  iconFile?: Express.Multer.File;

  @ApiProperty({ example: 'category-1' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    example: '5b3c4f8a-9d2c-4b2e-8f1a-1b2c3d4e5f6a',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | null | undefined }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @ValidateIf(
    (o: CreateCategoryDto) =>
      typeof o.parent_id === 'string' && o.parent_id.trim() !== '',
  )
  @IsUUID()
  parent_id?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Category 1' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Description of the category' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'category-1' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({
    example: '5b3c4f8a-9d2c-4b2e-8f1a-1b2c3d4e5f6a',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @Transform(({ value }: { value: string | null | undefined }) =>
    typeof value === 'string' && value.trim() === '' ? undefined : value,
  )
  @ValidateIf(
    (o: UpdateCategoryDto) =>
      typeof o.parent_id === 'string' && o.parent_id.trim() !== '',
  )
  @IsUUID()
  parent_id?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  is_active?: boolean;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Category icon image file',
  })
  @IsOptional()
  iconFile?: Express.Multer.File;
}

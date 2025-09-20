import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Category 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Description of the category' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'https://example.com/icon.png' })
  @IsString()
  @IsNotEmpty()
  icon_url: string;

  @ApiProperty({
    example: '5b3c4f8a-9d2c-4b2e-8f1a-1b2c3d4e5f6a',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsNotEmpty()
  is_active: boolean;
}

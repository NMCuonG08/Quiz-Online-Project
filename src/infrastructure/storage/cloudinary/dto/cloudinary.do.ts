import { IsDate, IsOptional, IsString } from 'class-validator';

export class CloudinaryDto {
  @IsString()
  @IsOptional()
  url: string;

  @IsString()
  @IsOptional()
  public_id: string;

  @IsDate()
  @IsOptional()
  createdAt: Date;
}
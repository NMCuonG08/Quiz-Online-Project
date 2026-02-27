import { ApiProperty } from '@nestjs/swagger';

export class RatingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  quiz_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty()
  user_name: string;

  @ApiProperty({ required: false })
  user_avatar?: string;

  @ApiProperty()
  rating: number;

  @ApiProperty({ required: false })
  comment?: string;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

import { ApiProperty } from '@nestjs/swagger';

export class QuestionOptionResponseDto {
  @ApiProperty({ description: 'Option ID' })
  id: string;

  @ApiProperty({ description: 'Question ID' })
  question_id: string;

  @ApiProperty({ description: 'Option text' })
  option_text: string;

  @ApiProperty({ description: 'Option content (alias for option_text)' })
  content: string;

  @ApiProperty({ description: 'Is this option correct' })
  is_correct: boolean;

  @ApiProperty({ description: 'Sort order' })
  sort_order: number;

  @ApiProperty({ description: 'Explanation for this option', required: false })
  explanation?: string;

  @ApiProperty({ description: 'Media URL for this option', required: false })
  media_url?: string;

  @ApiProperty({ description: 'Created date' })
  created_at: Date;

  @ApiProperty({ description: 'Updated date' })
  updated_at: Date;

  // Flattened fields
  @ApiProperty({ description: 'Question text' })
  question_text: string;

  @ApiProperty({ description: 'Question type' })
  question_type: string;
}

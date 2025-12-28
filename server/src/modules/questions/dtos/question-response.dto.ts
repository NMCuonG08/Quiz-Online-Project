import { ApiProperty } from '@nestjs/swagger';
import { QuestionOptionResponseDto } from './question-option-response.dto';

export class QuestionResponseDto {
  @ApiProperty({ description: 'Question ID' })
  id: string;

  @ApiProperty({ description: 'Quiz ID' })
  quiz_id: string;

  @ApiProperty({ description: 'Question text' })
  question_text: string;

  @ApiProperty({ description: 'Question content (alias for question_text)' })
  content: string;

  @ApiProperty({ description: 'Question slug', required: false })
  slug?: string;

  @ApiProperty({
    description: 'Question type',
    enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'FILL_BLANK', 'ESSAY', 'MATCHING'],
  })
  question_type: string;

  @ApiProperty({ description: 'Points for this question' })
  points: number;

  @ApiProperty({ description: 'Time limit in seconds', required: false })
  time_limit?: number;

  @ApiProperty({ description: 'Explanation for the answer', required: false })
  explanation?: string;

  @ApiProperty({ description: 'Media ID', required: false })
  media_id?: string;

  @ApiProperty({
    description: 'Media type',
    enum: ['IMAGE', 'VIDEO', 'AUDIO'],
    required: false,
  })
  media_type?: string;

  @ApiProperty({
    description: 'Difficulty level',
    enum: ['EASY', 'MEDIUM', 'HARD'],
  })
  difficulty_level: string;

  @ApiProperty({ description: 'Sort order' })
  sort_order: number;

  @ApiProperty({ description: 'Is question required' })
  is_required: boolean;

  @ApiProperty({ description: 'Additional settings' })
  settings: Record<string, any>;

  @ApiProperty({ description: 'Created date' })
  created_at: Date;

  @ApiProperty({ description: 'Updated date' })
  updated_at: Date;

  // Flattened fields
  @ApiProperty({ description: 'Quiz title' })
  quiz_title: string;

  @ApiProperty({ description: 'Media URL', required: false })
  media_url?: string;

  @ApiProperty({ description: 'Number of options' })
  options_count: number;

  @ApiProperty({
    type: [QuestionOptionResponseDto],
    description: 'Question options',
    required: false,
  })
  options?: QuestionOptionResponseDto[];
}

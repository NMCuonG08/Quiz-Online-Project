import { ApiProperty } from '@nestjs/swagger';

export class QuizResponseDto {
  @ApiProperty({ description: 'Quiz ID' })
  id: string;

  @ApiProperty({ description: 'Quiz title' })
  title: string;

  @ApiProperty({ description: 'Quiz slug' })
  slug: string;

  @ApiProperty({ description: 'Quiz description', required: false })
  description?: string;

  @ApiProperty({
    description: 'Difficulty level',
    enum: ['EASY', 'MEDIUM', 'HARD'],
  })
  difficulty_level: string;

  @ApiProperty({ description: 'Time limit in seconds', required: false })
  time_limit?: number;

  @ApiProperty({ description: 'Maximum attempts allowed' })
  max_attempts: number;

  @ApiProperty({ description: 'Passing score percentage' })
  passing_score: number;

  @ApiProperty({ description: 'Is quiz active' })
  is_active: boolean;

  @ApiProperty({
    description: 'Quiz type',
    enum: ['PRACTICE', 'EXAM', 'ASSIGNMENT'],
  })
  quiz_type: string;

  @ApiProperty({ description: 'Quiz tags', type: [String] })
  tags: string[];

  @ApiProperty({ description: 'Average rating (1-5)', example: 4.5 })
  average_rating: number;

  @ApiProperty({ description: 'Total number of ratings', example: 25 })
  total_ratings: number;

  @ApiProperty({ description: 'Created date' })
  created_at: Date;

  @ApiProperty({ description: 'Updated date' })
  updated_at: Date;

  @ApiProperty({ description: 'Published date', required: false })
  published_at?: Date;

  @ApiProperty({ description: 'Instructions', required: false })
  instructions?: string;

  // Flattened fields
  @ApiProperty({ description: 'Category ID', required: false })
  category_id?: string | null;

  @ApiProperty({ description: 'Category name' })
  category_name: string | null;

  @ApiProperty({ description: 'Creator name' })
  creator_name: string | null;

  @ApiProperty({ description: 'Thumbnail URL', required: false })
  thumbnail_url?: string | null;

  @ApiProperty({ description: 'Number of questions' })
  questions_count: number;

  @ApiProperty({ description: 'Number of attempts' })
  attempts_count: number;
}

import { QuizResponseDto } from '../dtos/quiz-response.dto';

interface QuizWithRelations {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  category_id: string;
  creator_id: string;
  difficulty_level: string;
  time_limit?: number | null;
  max_attempts: number;
  passing_score: number;
  is_active: boolean;
  quiz_type: string;
  tags: string[];
  created_at: Date;
  updated_at: Date;
  published_at?: Date | null;
  category?: { name: string } | null;
  creator?: { id: string } | null;
  thumbnail?: { url: string } | null;
  _count?: { questions: number; attempts: number } | null;
}

export function mapQuizToResponseDto(quiz: QuizWithRelations): QuizResponseDto {
  return {
    id: quiz.id,
    title: quiz.title,
    slug: quiz.slug,
    description: quiz.description || undefined,
    category_id: quiz.category_id,
    creator_id: quiz.creator_id,
    difficulty_level: quiz.difficulty_level,
    time_limit: quiz.time_limit || undefined,
    max_attempts: quiz.max_attempts,
    passing_score: quiz.passing_score,

    is_active: quiz.is_active,
    quiz_type: quiz.quiz_type,
    tags: quiz.tags,
    created_at: quiz.created_at,
    updated_at: quiz.updated_at,
    published_at: quiz.published_at || undefined,

    // Flattened fields
    category_name: quiz.category?.name || null,
    thumbnail_url: quiz.thumbnail?.url || null,
    questions_count: quiz._count?.questions || 0,
    attempts_count: quiz._count?.attempts || 0,
  };
}

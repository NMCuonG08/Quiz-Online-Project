import { QuestionResponseDto } from '../dtos/question-response.dto';
import { QuestionOptionResponseDto } from '../dtos/question-option-response.dto';
import { JsonValue } from '@prisma/client/runtime/library';

interface QuestionOptionWithRelations {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
  explanation?: string | null;
  media_url?: string | null;
  created_at: Date;
  updated_at: Date;
  question?: {
    question_text: string;
    question_type: string;
  };
}

interface QuestionWithRelations {
  id: string;
  quiz_id: string;
  question_text: string;
  slug?: string | null;
  question_type: string;
  points: number;
  time_limit?: number | null;
  explanation?: string | null;
  media_id?: string | null;
  media_type?: string | null;
  difficulty_level: string;
  sort_order: number;
  is_required: boolean;
  settings: JsonValue;
  created_at: Date;
  updated_at: Date;
  quiz?: { title: string } | null;
  media?: { url: string } | null;
  options?: QuestionOptionWithRelations[];
  _count?: { options: number } | null;
}

export function mapQuestionOptionToResponseDto(
  option: QuestionOptionWithRelations,
): QuestionOptionResponseDto {
  return {
    id: option.id,
    question_id: option.question_id,
    option_text: option.option_text,
    is_correct: option.is_correct,
    sort_order: option.sort_order,
    explanation: option.explanation || undefined,
    media_url: option.media_url || undefined,
    created_at: option.created_at,
    updated_at: option.updated_at,
    question_text: option.question?.question_text || '',
    question_type: option.question?.question_type || '',
  };
}

export function mapQuestionToResponseDto(
  question: QuestionWithRelations,
): QuestionResponseDto {
  return {
    id: question.id,
    quiz_id: question.quiz_id,
    question_text: question.question_text,
    slug: question.slug || undefined,
    question_type: question.question_type,
    points: question.points,
    time_limit: question.time_limit || undefined,
    explanation: question.explanation || undefined,
    media_id: question.media_id || undefined,
    media_type: question.media_type || undefined,
    difficulty_level: question.difficulty_level,
    sort_order: question.sort_order,
    is_required: question.is_required,
    settings: (question.settings as Record<string, any>) || {},
    created_at: question.created_at,
    updated_at: question.updated_at,

    // Flattened fields
    quiz_title: question.quiz?.title || '',
    media_url: question.media?.url || undefined,
    options_count: question._count?.options || question.options?.length || 0,
    options: question.options?.map(mapQuestionOptionToResponseDto) || undefined,
  };
}

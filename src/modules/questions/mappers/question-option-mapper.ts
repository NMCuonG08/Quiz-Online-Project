import { QuestionOptionResponseDto } from '../dtos/question-option-response.dto';

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
  } | null;
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

    // Flattened fields
    question_text: option.question?.question_text || '',
    question_type: option.question?.question_type || '',
  };
}

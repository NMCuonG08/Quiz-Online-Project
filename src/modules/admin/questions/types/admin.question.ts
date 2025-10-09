export type QuestionOption = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  sort_order: number;
  explanation?: string | null;
  media_url?: string | null;
};

export type QuestionItem = {
  id: string;
  quiz_id: string;
  question_text: string;
  slug: string;
  question_type: string;
  points: number;
  time_limit: number;
  explanation?: string | null;
  media_type?: string | null;
  difficulty_level?: string | null;
  sort_order?: number | null;
  is_required?: boolean | null;
  settings?: string | null;
  created_at?: string;
  updated_at?: string;
  quiz_title?: string;
  options_count?: number;
  options?: QuestionOption[];
};

export type QuestionsPagination = {
  page: number;
  limit: number;
  total: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type QuestionsResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    items: QuestionItem[];
    pagination: QuestionsPagination;
  };
};

export type QuestionsQueryParams = {
  page?: number;
  limit?: number;
};

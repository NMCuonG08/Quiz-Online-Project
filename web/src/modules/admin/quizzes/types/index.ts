export interface Quiz {
  id: string;
  title: string;
  slug: string;
  description: string;
  category_id: string;
  creator_id: string;
  difficulty_level: string;
  time_limit: number;
  max_attempts: number;
  passing_score: number;
  is_public: boolean;
  is_active: boolean;
  quiz_type: string;
  instructions: string;
  thumbnail_id: string | null;
  tags: string[];
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  published_at: string;
  category_name: string;
  thumbnail_url: string;
  questions_count: number;
  attempts_count: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedQuizResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    items: Quiz[];
    pagination: PaginationInfo;
  };
}

export interface QuizResponse<T = Quiz | Quiz[]> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface CreateQuizPayload {
  title: string;
  slug: string;
  description: string;
  instructions: string;
  category_id: string;
  difficulty_level: string;
  time_limit: number;
  max_attempts: number;
  passing_score: number;
  is_public: boolean;
  is_active: boolean;
  quiz_type: string;
  tags?: string[];
  thumbnailFile?: File | null;
}

export interface UpdateQuizPayload extends Partial<CreateQuizPayload> {}

export interface QuizQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  difficulty_level?: string;
  is_active?: boolean;
}

export interface DeleteResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: boolean;
}

export interface QuizCardProps {
  id: string;
  title: string;
  thumbnail_url: string;
  average_rating: number;
  total_ratings: number;
  creator_name: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD" | "AI GENERATED";
  difficulty_level?: string;
  category_name?: string;
  quiz_type?: string;
  slug?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
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
    items: QuizCardProps[];
    pagination: PaginationInfo;
  };
}

export interface QuizQueryParams {
  page?: number;
  limit?: number;
  difficulty?: string;
  search?: string;
  sortBy?: "rating" | "createdAt" | "popularity";
  sortOrder?: "asc" | "desc";
}

export interface QuizCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  thumbnail_url?: string;
  quizCount?: number;
}

export interface QuizState {
  recentlyPublished: {
    quizzes: QuizCardProps[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
  };
  bestRated: {
    quizzes: QuizCardProps[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
  };
  popular: {
    quizzes: QuizCardProps[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
  };
  easy: {
    quizzes: QuizCardProps[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
  };
  hard: {
    quizzes: QuizCardProps[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
  };
  difficulty: {
    quizzes: QuizCardProps[];
    pagination: PaginationInfo | null;
    loading: boolean;
    error: string | null;
    currentDifficulty: string | null;
  };
}

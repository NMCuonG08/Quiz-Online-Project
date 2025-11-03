import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export interface QuizDetailData {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty_level: string;
  time_limit: number;
  max_attempts: number;
  passing_score: number;
  is_active: boolean;
  quiz_type: string;
  tags: string[];
  average_rating: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  instructions: string | null;
  category_name: string | null;
  creator_name: string | null;
  thumbnail_url: string | null;
  questions_count: number;
  attempts_count: number;
}

export interface QuizDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: QuizDetailData;
  error?: { message: string };
}

export class QuizDetailService {
  static async getBySlug(slug: string): Promise<QuizDetailResponse> {
    try {
      const response = await apiClient.get(apiRoutes.QUIZZES.GET_BY_SLUG(slug));
      return response.data as QuizDetailResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as QuizDetailResponse) || {
          success: false,
          statusCode: 500,
          message: "Failed to fetch quiz detail",
          error: { message: "Failed to fetch quiz detail" },
        }
      );
    }
  }
}

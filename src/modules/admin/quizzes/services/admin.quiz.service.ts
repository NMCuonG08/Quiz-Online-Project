import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export interface Quiz {
  id: number;
  name: string;
  slug: string;
  icon_url?: string;
  description?: string;
  is_active?: boolean | null;
  created_at?: string;
  category_id?: number | null;
  category_name?: string;
}

export interface QuizResponse<T = Quiz | Quiz[]> {
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export class QuizService {
  static async getQuizzes(): Promise<QuizResponse<Quiz[]>> {
    try {
      const response = await apiClient.get(apiRoutes.QUIZZES.GET_ALL);
      return response.data;
    } catch (error: any) {
      return (
        error.response?.data || {
          error: { message: "Failed to fetch quizzes", code: "QUIZZES_ERROR" },
        }
      );
    }
  }

  static async getQuizBySlug(slug: string): Promise<QuizResponse<Quiz>> {
    try {
      const response = await apiClient.get(apiRoutes.QUIZZES.GET_BY_SLUG(slug));
      return response.data;
    } catch (error: any) {
      return (
        error.response?.data || {
          error: { message: "Failed to fetch quiz", code: "QUIZ_ERROR" },
        }
      );
    }
  }
}

import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export interface RatingData {
  id: string;
  quiz_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface RatingsListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    items: RatingData[];
    pagination: {
      totalItems: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

export interface RatingCreateResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: RatingData;
}

export class RatingService {
  static async getRatings(quizId: string, page: number = 1, limit: number = 5): Promise<RatingsListResponse> {
    try {
      const response = await apiClient.get(apiRoutes.FEEDBACK.GET_RATINGS, {
        params: { quiz_id: quizId, page, limit }
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) return error.response.data;
      throw error;
    }
  }

  static async createOrUpdateRating(quizId: string, rating: number, comment?: string): Promise<RatingCreateResponse> {
    try {
      const response = await apiClient.post(apiRoutes.FEEDBACK.POST_RATING, {
        quiz_id: quizId,
        rating,
        comment
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) return error.response.data;
      throw error;
    }
  }

  static async deleteRating(quizId: string): Promise<any> {
    try {
      const response = await apiClient.delete(apiRoutes.FEEDBACK.DELETE_RATING(quizId));
      return response.data;
    } catch (error: any) {
      if (error.response?.data) return error.response.data;
      throw error;
    }
  }
}

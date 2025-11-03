import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import {
  type QuizCardProps,
  type PaginatedQuizResponse,
  type QuizQueryParams,
} from "../types/quiz.types";

export class ClientQuizService {
  static async getBestRatedQuizzes(
    params?: QuizQueryParams
  ): Promise<PaginatedQuizResponse> {
    try {
      const response = await apiClient.get(apiRoutes.QUIZZES.BEST_RATED, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          ...params,
        },
      });
      return response.data;
    } catch (error: unknown) {
      return this.handleError(error, "Failed to fetch best rated quizzes");
    }
  }

  static async getRecentlyPublishedQuizzes(
    params?: QuizQueryParams
  ): Promise<PaginatedQuizResponse> {
    try {
      const response = await apiClient.get(
        apiRoutes.QUIZZES.RECENTLY_PUBLISHED,
        {
          params: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            ...params,
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      return this.handleError(
        error,
        "Failed to fetch recently published quizzes"
      );
    }
  }

  static async getPopularQuizzes(
    params?: QuizQueryParams
  ): Promise<PaginatedQuizResponse> {
    try {
      const response = await apiClient.get(apiRoutes.QUIZZES.POPULAR, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          ...params,
        },
      });
      return response.data;
    } catch (error: unknown) {
      return this.handleError(error, "Failed to fetch popular quizzes");
    }
  }

  static async getEasyQuizzes(
    params?: QuizQueryParams
  ): Promise<PaginatedQuizResponse> {
    try {
      const response = await apiClient.get(apiRoutes.QUIZZES.EASY, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          ...params,
        },
      });
      return response.data;
    } catch (error: unknown) {
      return this.handleError(error, "Failed to fetch easy quizzes");
    }
  }

  static async getHardQuizzes(
    params?: QuizQueryParams
  ): Promise<PaginatedQuizResponse> {
    try {
      const response = await apiClient.get(apiRoutes.QUIZZES.HARD, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          ...params,
        },
      });
      return response.data;
    } catch (error: unknown) {
      return this.handleError(error, "Failed to fetch hard quizzes");
    }
  }

  static async getQuizzesByDifficulty(
    difficulty: string,
    params?: QuizQueryParams
  ): Promise<PaginatedQuizResponse> {
    try {
      const response = await apiClient.get(
        apiRoutes.QUIZZES.BY_DIFFICULTY(difficulty),
        {
          params: {
            page: params?.page || 1,
            limit: params?.limit || 10,
            ...params,
          },
        }
      );
      return response.data;
    } catch (error: unknown) {
      return this.handleError(error, `Failed to fetch ${difficulty} quizzes`);
    }
  }

  private static handleError(
    error: unknown,
    message: string
  ): PaginatedQuizResponse {
    const err = error as { response?: { data?: unknown } };
    return (
      err.response?.data || {
        success: false,
        statusCode: 500,
        message,
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      }
    );
  }
}

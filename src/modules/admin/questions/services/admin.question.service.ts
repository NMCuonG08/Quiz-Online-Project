import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { type QuestionsResponse, type QuestionsQueryParams } from "../types";

export class AdminQuestionService {
  static async getQuestionsById(
    id: string,
    params?: QuestionsQueryParams
  ): Promise<QuestionsResponse> {
    try {
      const response = await apiClient.get(
        apiRoutes.QUESTIONS.GET_BY_ID(id),
        {
          params: { page: params?.page || 1, limit: params?.limit || 10 },
        }
      );
      return response.data as QuestionsResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as QuestionsResponse) || {
          success: false,
          statusCode: 500,
          message: "Failed to fetch questions",
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
}

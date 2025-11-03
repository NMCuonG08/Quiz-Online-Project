import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import {
  type Quiz,
  type PaginatedQuizResponse,
  type QuizResponse,
  type CreateQuizPayload,
  type UpdateQuizPayload,
  type QuizQueryParams,
  type DeleteResponse,
} from "../types";

export class QuizService {
  static async getQuizzes(
    params?: QuizQueryParams
  ): Promise<PaginatedQuizResponse> {
    try {
      const response = await apiClient.get(apiRoutes.QUIZZES.GET_ALL, {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          ...params,
        },
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        err.response?.data || {
          success: false,
          statusCode: 500,
          message: "Failed to fetch quizzes",
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

  static async getQuizBySlug(slug: string): Promise<QuizResponse<Quiz>> {
    try {
      const response = await apiClient.get(apiRoutes.QUIZZES.GET_BY_SLUG(slug));
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        err.response?.data || {
          error: { message: "Failed to fetch quiz", code: "QUIZ_ERROR" },
        }
      );
    }
  }

  static async createQuiz(
    payload: CreateQuizPayload
  ): Promise<QuizResponse<Quiz>> {
    try {
      // If there is a thumbnail file, send as multipart/form-data
      let body: FormData | Record<string, unknown>;
      if (payload.thumbnailFile) {
        console.log(
          "Creating FormData with thumbnail file:",
          payload.thumbnailFile
        );
        const form = new FormData();
        Object.entries(payload as Record<string, unknown>).forEach(
          ([key, value]) => {
            if (key === "thumbnailFile") return;
            if (key === "tags") {
              if (Array.isArray(value) && value.length > 0) {
                form.append(key, JSON.stringify(value));
              }
              return;
            }
            const v = Array.isArray(value)
              ? JSON.stringify(value)
              : String(value ?? "");
            form.append(key, v);
          }
        );
        form.append("thumbnail", payload.thumbnailFile);
        body = form;

        // Debug: Log FormData contents
        console.log("FormData contents:");
        for (const [key, value] of form.entries()) {
          console.log(`${key}:`, value);
        }
      } else {
        console.log("Creating JSON body without thumbnail");
        const jsonBody: Record<string, unknown> = {
          ...(payload as Record<string, unknown>),
        };
        if (
          "tags" in jsonBody &&
          (!Array.isArray(jsonBody.tags) ||
            (jsonBody.tags as unknown[]).length === 0)
        ) {
          delete jsonBody.tags;
        }
        body = jsonBody;
      }
      const response = await apiClient.post(apiRoutes.QUIZZES.CREATE, body);
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        err.response?.data || {
          error: {
            message: "Failed to create quiz",
            code: "QUIZ_CREATE_ERROR",
          },
        }
      );
    }
  }

  static async updateQuizById(
    id: string,
    payload: UpdateQuizPayload
  ): Promise<QuizResponse<Quiz>> {
    try {
      let body: FormData | Record<string, unknown>;
      if (payload.thumbnailFile) {
        const form = new FormData();
        Object.entries(payload as Record<string, unknown>).forEach(
          ([key, value]) => {
            if (key === "thumbnailFile") return;
            if (key === "tags") {
              if (Array.isArray(value) && value.length > 0) {
                form.append(key, JSON.stringify(value));
              }
              return;
            }
            const v = Array.isArray(value)
              ? JSON.stringify(value)
              : String(value ?? "");
            form.append(key, v);
          }
        );
        form.append("thumbnail", payload.thumbnailFile);
        body = form;
      } else {
        const jsonBody: Record<string, unknown> = {
          ...(payload as Record<string, unknown>),
        };
        if (
          "tags" in jsonBody &&
          (!Array.isArray(jsonBody.tags) ||
            (jsonBody.tags as unknown[]).length === 0)
        ) {
          delete jsonBody.tags;
        }
        body = jsonBody;
      }
      const response = await apiClient.patch(
        apiRoutes.QUIZZES.UPDATE_BY_ID(id),
        body
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        err.response?.data || {
          error: {
            message: "Failed to update quiz",
            code: "QUIZ_UPDATE_ERROR",
          },
        }
      );
    }
  }

  static async deleteQuizById(
    id: string
  ): Promise<DeleteResponse | QuizResponse<null>> {
    try {
      const response = await apiClient.delete(
        apiRoutes.QUIZZES.DELETE_BY_ID(id)
      );
      return response.data as DeleteResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        err.response?.data || {
          error: {
            message: "Failed to delete quiz",
            code: "QUIZ_DELETE_ERROR",
          },
        }
      );
    }
  }
}

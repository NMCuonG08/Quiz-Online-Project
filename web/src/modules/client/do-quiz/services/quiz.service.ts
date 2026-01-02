import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import {
  Question,
  QuizSession,
  UserAnswer,
  QuizResult,
} from "../types/quiz.types";

export interface QuizQuestionsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: Question[];
  error?: { message: string };
}

export interface QuizSessionResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: QuizSession;
  error?: { message: string };
}

export interface QuizResultResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: QuizResult;
  error?: { message: string };
}

export class QuizService {
  static async getQuizQuestions(
    quizId: string
  ): Promise<QuizQuestionsResponse> {
    try {
      // Check if quizId is a UUID (starts with letters/numbers and has dashes)
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          quizId
        );

      const endpoint = isUUID
        ? apiRoutes.QUESTIONS.GET_PUBLIC_BY_QUIZ(quizId)
        : apiRoutes.QUESTIONS.GET_PUBLIC_BY_SLUG(quizId);

      const response = await apiClient.get(endpoint);
      return response.data as QuizQuestionsResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as QuizQuestionsResponse) || {
          success: false,
          statusCode: 500,
          message: "Failed to fetch quiz questions",
          error: { message: "Failed to fetch quiz questions" },
        }
      );
    }
  }

  static async startQuizSession(quizId: string): Promise<QuizSessionResponse> {
    try {
      // Check if quizId is a UUID (starts with letters/numbers and has dashes)
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          quizId
        );

      const endpoint = isUUID
        ? apiRoutes.QUIZ_SESSIONS.CREATE_PUBLIC
        : apiRoutes.QUIZ_SESSIONS.CREATE_PUBLIC_BY_SLUG;

      const payload = isUUID ? { quiz_id: quizId } : { quiz_slug: quizId };

      const response = await apiClient.post(endpoint, payload);
      return response.data as QuizSessionResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as QuizSessionResponse) || {
          success: false,
          statusCode: 500,
          message: "Failed to start quiz session",
          error: { message: "Failed to start quiz session" },
        }
      );
    }
  }

  static async submitAnswer(
    sessionId: string,
    questionId: string,
    answer: UserAnswer
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post(
        apiRoutes.QUIZ_SESSIONS.SUBMIT_ANSWER_PUBLIC(sessionId),
        {
          question_id: questionId,
          ...answer,
        }
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as { success: boolean; message: string }) || {
          success: false,
          message: "Failed to submit answer",
        }
      );
    }
  }

  static async completeQuiz(sessionId: string): Promise<QuizResultResponse> {
    try {
      const response = await apiClient.post(
        apiRoutes.QUIZ_SESSIONS.COMPLETE_PUBLIC(sessionId)
      );
      return response.data as QuizResultResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as QuizResultResponse) || {
          success: false,
          statusCode: 500,
          message: "Failed to complete quiz",
          error: { message: "Failed to complete quiz" },
        }
      );
    }
  }

  static async getQuizResult(sessionId: string): Promise<QuizResultResponse> {
    try {
      const response = await apiClient.get(
        apiRoutes.QUIZ_SESSIONS.GET_RESULT(sessionId)
      );
      return response.data as QuizResultResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as QuizResultResponse) || {
          success: false,
          statusCode: 500,
          message: "Failed to get quiz result",
          error: { message: "Failed to get quiz result" },
        }
      );
    }
  }

  static async getUserQuizHistory(
    page = 1,
    limit = 10
  ): Promise<QuizHistoryResponse> {
    try {
      const response = await apiClient.get(
        `${apiRoutes.QUIZ_SESSIONS.USER_HISTORY}?page=${page}&limit=${limit}`
      );
      const responseData = response.data;
      // Handle both { data, meta } and direct response
      const data = Array.isArray(responseData?.data) ? responseData.data : [];
      const meta = responseData?.meta;
      return {
        success: true,
        data,
        meta,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as QuizHistoryResponse) || {
          success: false,
          message: "Failed to fetch quiz history",
          data: [],
        }
      );
    }
  }

  static async getUserInProgressQuizzes(): Promise<InProgressQuizzesResponse> {
    try {
      const response = await apiClient.get(
        apiRoutes.QUIZ_SESSIONS.USER_IN_PROGRESS
      );
      // Handle both direct array and wrapped response
      const responseData = response.data;
      const data = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data ?? []);
      return {
        success: true,
        data,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as InProgressQuizzesResponse) || {
          success: false,
          message: "Failed to fetch in-progress quizzes",
          data: [],
        }
      );
    }
  }

  static async getAllUserAttempts(
    page = 1,
    limit = 10
  ): Promise<AllAttemptsResponse> {
    try {
      const response = await apiClient.get(
        `${apiRoutes.QUIZ_SESSIONS.USER_ALL_ATTEMPTS}?page=${page}&limit=${limit}`
      );
      // Response is wrapped: { success, statusCode, message, data: { data: [...], meta: {...} } }
      const responseData = response.data?.data || response.data;
      const data = Array.isArray(responseData?.data) ? responseData.data : (Array.isArray(responseData) ? responseData : []);
      const meta = responseData?.meta;
      return {
        success: true,
        data,
        meta,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as AllAttemptsResponse) || {
          success: false,
          message: "Failed to fetch all attempts",
          data: [],
        }
      );
    }
  }

  static async deleteAttempt(attemptId: string) {
    try {
      const response = await apiClient.delete(
        apiRoutes.QUIZ_SESSIONS.DELETE_ATTEMPT(attemptId)
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Additional types for history
export interface QuizHistoryItem {
  id: string;
  quiz_id: string;
  quiz_title: string;
  quiz_slug: string;
  quiz_thumbnail: string | null;
  category_name: string | null;
  total_questions: number;
  correct_answers: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  time_taken: number | null;
  completed_at: string | null;
  attempt_number: number;
}

export interface QuizHistoryResponse {
  success: boolean;
  data?: QuizHistoryItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface InProgressQuiz {
  id: string;
  quiz_id: string;
  quiz_title: string;
  quiz_slug: string;
  quiz_thumbnail: string | null;
  total_questions: number;
  answered_questions: number;
  started_at: string;
}

export interface InProgressQuizzesResponse {
  success: boolean;
  data?: InProgressQuiz[];
  message?: string;
}

// Combined attempt type (both IN_PROGRESS and COMPLETED)
export interface QuizAttemptItem {
  id: string;
  quiz_id: string;
  quiz_title: string;
  quiz_slug: string;
  quiz_thumbnail: string | null;
  category_name: string | null;
  total_questions: number;
  answered_questions: number;
  correct_answers: number;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  time_taken: number | null;
  started_at: string;
  completed_at: string | null;
  attempt_number: number;
}

export interface AllAttemptsResponse {
  success: boolean;
  data?: QuizAttemptItem[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}



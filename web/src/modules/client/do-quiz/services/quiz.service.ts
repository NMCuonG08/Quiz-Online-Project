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
}

"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchQuizzes,
  fetchQuizBySlug,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  clearError,
  clearCurrentQuiz,
  clearQuizzes,
} from "../slices/user.quiz.slice";
import {
  QuizQueryParams,
  type CreateQuizPayload,
  type UpdateQuizPayload,
} from "../types";

export const useUserQuiz = () => {
  const dispatch = useAppDispatch();
  const { quizzes, currentQuiz, pagination, loading, error } = useAppSelector(
    (state: any) => state.userQuiz
  );

  const getQuizzes = useCallback(
    async (params?: QuizQueryParams) => {
      try {
        const result = await dispatch(fetchQuizzes(params)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const getQuizBySlug = useCallback(
    async (slug: string) => {
      try {
        const result = await dispatch(fetchQuizBySlug(slug)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const clearQuizError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const clearCurrent = useCallback(() => {
    dispatch(clearCurrentQuiz());
  }, [dispatch]);

  const clearAll = useCallback(() => {
    dispatch(clearQuizzes());
  }, [dispatch]);

  const createQuizAction = useCallback(
    async (data: CreateQuizPayload) => {
      try {
        const result = await dispatch(createQuiz(data)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        // Pass through server error object if available
        return { success: false, error } as { success: false; error: unknown };
      }
    },
    [dispatch]
  );

  const updateQuizAction = useCallback(
    async (id: string, data: UpdateQuizPayload) => {
      try {
        const result = await dispatch(updateQuiz({ id, data })).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  const deleteQuizAction = useCallback(
    async (id: string) => {
      try {
        await dispatch(deleteQuiz(id)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  return {
    quizzes,
    currentQuiz,
    pagination,
    loading,
    error,
    getQuizzes,
    getQuizBySlug,
    clearQuizError,
    clearCurrent,
    clearAll,
    createQuiz: createQuizAction,
    updateQuiz: updateQuizAction,
    deleteQuiz: deleteQuizAction,
  };
};

"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchQuizzes,
  fetchQuizBySlug,
  clearError,
  clearCurrentQuiz,
  clearQuizzes,
} from "../slices/admin.quiz.slice";

export const useAdminQuiz = () => {
  const dispatch = useAppDispatch();
  const { quizzes, currentQuiz, loading, error } = useAppSelector(
    (state) => state.adminQuiz
  );

  const getQuizzes = useCallback(async () => {
    try {
      const result = await dispatch(fetchQuizzes()).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as string };
    }
  }, [dispatch]);

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

  return {
    quizzes,
    currentQuiz,
    loading,
    error,
    getQuizzes,
    getQuizBySlug,
    clearQuizError,
    clearCurrent,
    clearAll,
  };
};

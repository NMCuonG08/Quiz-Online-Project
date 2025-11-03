"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchRecentlyPublishedQuizzes,
  fetchBestRatedQuizzes,
  fetchPopularQuizzes,
  fetchEasyQuizzes,
  fetchHardQuizzes,
  fetchQuizzesByDifficulty,
  clearError,
  clearAllErrors,
  clearQuizzes,
  clearAllQuizzes,
} from "../slices/client.quiz.slice";
import { type QuizQueryParams } from "../types/quiz.types";

export const useClientQuiz = () => {
  const dispatch = useAppDispatch();
  const clientQuizState = useAppSelector((state) => state.clientQuiz);

  // Recently Published Quizzes
  const getRecentlyPublishedQuizzes = useCallback(
    async (params?: QuizQueryParams) => {
      try {
        const result = await dispatch(
          fetchRecentlyPublishedQuizzes(params)
        ).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Best Rated Quizzes
  const getBestRatedQuizzes = useCallback(
    async (params?: QuizQueryParams) => {
      try {
        const result = await dispatch(fetchBestRatedQuizzes(params)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Popular Quizzes
  const getPopularQuizzes = useCallback(
    async (params?: QuizQueryParams) => {
      try {
        const result = await dispatch(fetchPopularQuizzes(params)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Easy Quizzes
  const getEasyQuizzes = useCallback(
    async (params?: QuizQueryParams) => {
      try {
        const result = await dispatch(fetchEasyQuizzes(params)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Hard Quizzes
  const getHardQuizzes = useCallback(
    async (params?: QuizQueryParams) => {
      try {
        const result = await dispatch(fetchHardQuizzes(params)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Quizzes by Difficulty
  const getQuizzesByDifficulty = useCallback(
    async (difficulty: string, params?: QuizQueryParams) => {
      try {
        const result = await dispatch(
          fetchQuizzesByDifficulty({ difficulty, params })
        ).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Clear error for specific category
  const clearQuizError = useCallback(
    (category: keyof typeof clientQuizState) => {
      dispatch(clearError(category));
    },
    [dispatch]
  );

  // Clear all errors
  const clearAllQuizErrors = useCallback(() => {
    dispatch(clearAllErrors());
  }, [dispatch]);

  // Clear quizzes for specific category
  const clearQuizCategory = useCallback(
    (category: keyof typeof clientQuizState) => {
      dispatch(clearQuizzes(category));
    },
    [dispatch]
  );

  // Clear all quizzes
  const clearAllQuizData = useCallback(() => {
    dispatch(clearAllQuizzes());
  }, [dispatch]);

  return {
    // State
    recentlyPublished: clientQuizState.recentlyPublished,
    bestRated: clientQuizState.bestRated,
    popular: clientQuizState.popular,
    easy: clientQuizState.easy,
    hard: clientQuizState.hard,
    difficulty: clientQuizState.difficulty,

    // Actions
    getRecentlyPublishedQuizzes,
    getBestRatedQuizzes,
    getPopularQuizzes,
    getEasyQuizzes,
    getHardQuizzes,
    getQuizzesByDifficulty,

    // Utility actions
    clearQuizError,
    clearAllQuizErrors,
    clearQuizCategory,
    clearAllQuizData,
  };
};

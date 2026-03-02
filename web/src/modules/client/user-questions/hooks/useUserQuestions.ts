"use client";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchQuestionsById,
  clearQuestions,
  clearQuestionsError,
  createQuestion,
  updateQuestion,
  deleteQuestion,
} from "../slices/user.question.slice";
import type { QuestionsQueryParams } from "../services/user.question.service";
import type {
  CreateQuestionInput,
  UpdateQuestionInput,
} from "../schema/question";

export const useUserQuestions = () => {
  const dispatch = useAppDispatch();
  const { items, pagination, loading, error } = useAppSelector(
    (state: any) => state.userQuestion
  );

  const getQuestions = useCallback(
    async (id: string, params?: QuestionsQueryParams) => {
      try {
        const result = await dispatch(
          fetchQuestionsById({ id, params })
        ).unwrap();
        return { success: true, data: result } as const;
      } catch (err) {
        return { success: false, error: err } as const;
      }
    },
    [dispatch]
  );

  const clearError = useCallback(() => {
    dispatch(clearQuestionsError());
  }, [dispatch]);

  const clearAll = useCallback(() => {
    dispatch(clearQuestions());
  }, [dispatch]);

  const addQuestion = useCallback(
    async (data: CreateQuestionInput) => {
      try {
        const result = await dispatch(createQuestion(data)).unwrap();
        return { success: true, data: result } as const;
      } catch (err) {
        return { success: false, error: err } as const;
      }
    },
    [dispatch]
  );

  const editQuestion = useCallback(
    async (id: string, data: UpdateQuestionInput) => {
      try {
        const result = await dispatch(updateQuestion({ id, data })).unwrap();
        return { success: true, data: result } as const;
      } catch (err) {
        return { success: false, error: err } as const;
      }
    },
    [dispatch]
  );

  const removeQuestion = useCallback(
    async (id: string) => {
      try {
        const result = await dispatch(deleteQuestion(id)).unwrap();
        return { success: true, data: result } as const;
      } catch (err) {
        return { success: false, error: err } as const;
      }
    },
    [dispatch]
  );

  return {
    items,
    pagination,
    loading,
    error,
    getQuestions,
    clearError,
    clearAll,
    addQuestion,
    editQuestion,
    removeQuestion,
  };
};

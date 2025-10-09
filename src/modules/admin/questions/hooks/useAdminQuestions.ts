"use client";
import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchQuestionsById,
  clearQuestions,
  clearQuestionsError,
} from "../slices/admin.question.slice";
import type { QuestionsQueryParams } from "../services/admin.question.service";

export const useAdminQuestions = () => {
  const dispatch = useAppDispatch();
  const { items, pagination, loading, error } = useAppSelector(
    (state) => state.adminQuestion
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

  return {
    items,
    pagination,
    loading,
    error,
    getQuestions,
    clearError,
    clearAll,
  };
};

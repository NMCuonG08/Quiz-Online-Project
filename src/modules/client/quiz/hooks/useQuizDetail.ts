"use client";

import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  clearQuizDetail,
  fetchQuizDetailBySlug,
} from "../slices/quiz.detail.slice";

export const useQuizDetail = (slug: string) => {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.quizDetail);

  useEffect(() => {
    if (slug) {
      void dispatch(fetchQuizDetailBySlug(slug));
    }
    return () => {
      dispatch(clearQuizDetail());
    };
  }, [dispatch, slug]);

  const refetch = useCallback(async () => {
    try {
      await dispatch(fetchQuizDetailBySlug(slug)).unwrap();
      return { success: true };
    } catch (e) {
      return { success: false, error: e as string };
    }
  }, [dispatch, slug]);

  return { data, loading, error, refetch };
};

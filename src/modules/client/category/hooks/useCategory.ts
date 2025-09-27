import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchCategories,
  fetchCategoryBySlug,
  clearError,
  clearCurrentCategory,
  clearCategories,
} from "../slices/category.slice";

/**
 * Hook quản lý category, trả về state và actions
 */
export const useCategory = () => {
  const dispatch = useAppDispatch();
  const { categories, currentCategory, loading, error } = useAppSelector(
    (state) => state.category
  );

  // Lấy danh sách tất cả categories
  const getCategories = useCallback(async () => {
    try {
      const result = await dispatch(fetchCategories()).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as string };
    }
  }, [dispatch]);

  // Lấy category theo slug
  const getCategoryBySlug = useCallback(
    async (slug: string) => {
      try {
        const result = await dispatch(fetchCategoryBySlug(slug)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Clear error
  const clearCategoryError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Clear current category
  const clearCurrent = useCallback(() => {
    dispatch(clearCurrentCategory());
  }, [dispatch]);

  // Clear all categories
  const clearAll = useCallback(() => {
    dispatch(clearCategories());
  }, [dispatch]);

  return {
    // State
    categories,
    currentCategory,
    loading,
    error,

    // Actions
    getCategories,
    getCategoryBySlug,
    clearCategoryError,
    clearCurrent,
    clearAll,
  };
};

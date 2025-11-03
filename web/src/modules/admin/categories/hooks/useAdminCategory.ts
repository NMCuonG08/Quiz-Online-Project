"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchCategories,
  fetchCategoryBySlug,
  createCategory as createCategoryThunk,
  updateCategory as updateCategoryThunk,
  deleteCategory as deleteCategoryThunk,
  clearError,
  clearCurrentCategory,
  clearCategories,
} from "../slices/admin.category.slice";

/**
 * Hook quản lý category, trả về state và actions
 */
export const useAdminCategory = () => {
  const dispatch = useAppDispatch();
  const { categories, currentCategory, loading, error } = useAppSelector(
    (state) => state.adminCategory
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

  // Tạo category
  const createCategory = useCallback(
    async (data: {
      name: string;
      slug: string;
      description?: string;
      isActive?: boolean;
      parentId?: string | number | null;
      iconFile?: File | null;
    }) => {
      try {
        const result = await dispatch(createCategoryThunk(data)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error } as { success: false; error: unknown };
      }
    },
    [dispatch]
  );

  // Cập nhật category
  const updateCategory = useCallback(
    async (
      id: string | number,
      data: {
        name?: string;
        slug?: string;
        description?: string;
        isActive?: boolean;
        parentId?: string | number | null;
        iconFile?: File | null;
      }
    ) => {
      try {
        const result = await dispatch(
          updateCategoryThunk({ id, data })
        ).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Xoá category
  const deleteCategory = useCallback(
    async (id: string | number) => {
      try {
        await dispatch(deleteCategoryThunk(id)).unwrap();
        return { success: true };
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
    createCategory,
    updateCategory,
    deleteCategory,
    clearCategoryError,
    clearCurrent,
    clearAll,
  };
};

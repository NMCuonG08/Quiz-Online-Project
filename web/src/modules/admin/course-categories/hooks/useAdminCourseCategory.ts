"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchCourseCategories,
  fetchCourseCategoryBySlug,
  createCourseCategory as createCourseCategoryThunk,
  updateCourseCategory as updateCourseCategoryThunk,
  deleteCourseCategory as deleteCourseCategoryThunk,
  clearCourseCategoryError,
  clearCurrentCourseCategory,
  clearCourseCategories,
} from "../slices/admin.course.category.slice";

/**
 * Hook quản lý course category, trả về state và actions
 * Sử dụng cùng endpoint /api/categories với quiz category
 */
export const useAdminCourseCategory = () => {
  const dispatch = useAppDispatch();
  const { categories, currentCategory, loading, error } = useAppSelector(
    (state) => state.adminCourseCategory
  );

  // Fetch all categories
  const getCategories = useCallback(async () => {
    try {
      const result = await dispatch(fetchCourseCategories()).unwrap();
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error as string };
    }
  }, [dispatch]);

  // Fetch by slug
  const getCategoryBySlug = useCallback(
    async (slug: string) => {
      try {
        const result = await dispatch(fetchCourseCategoryBySlug(slug)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Create category
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
        const result = await dispatch(createCourseCategoryThunk(data)).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error } as { success: false; error: unknown };
      }
    },
    [dispatch]
  );

  // Update category
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
          updateCourseCategoryThunk({ id, data })
        ).unwrap();
        return { success: true, data: result };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Delete category
  const deleteCategory = useCallback(
    async (id: string | number) => {
      try {
        await dispatch(deleteCourseCategoryThunk(id)).unwrap();
        return { success: true };
      } catch (error) {
        return { success: false, error: error as string };
      }
    },
    [dispatch]
  );

  // Clear error
  const clearError = useCallback(() => {
    dispatch(clearCourseCategoryError());
  }, [dispatch]);

  // Clear current
  const clearCurrent = useCallback(() => {
    dispatch(clearCurrentCourseCategory());
  }, [dispatch]);

  // Clear all
  const clearAll = useCallback(() => {
    dispatch(clearCourseCategories());
  }, [dispatch]);

  return {
    categories,
    currentCategory,
    loading,
    error,
    getCategories,
    getCategoryBySlug,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    clearCurrent,
    clearAll,
  };
};

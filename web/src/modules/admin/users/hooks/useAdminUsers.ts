"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchUsers,
  fetchRoles,
  updateUserRoles,
  clearError,
} from "../slices/admin.user.slice";

export const useAdminUsers = () => {
  const dispatch = useAppDispatch();
  const { users, roles, loading, error } = useAppSelector(
    (state) => state.adminUser
  );

  const getUsers = useCallback(async () => {
    try {
      await dispatch(fetchUsers()).unwrap();
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, [dispatch]);

  const getRoles = useCallback(async () => {
    try {
      await dispatch(fetchRoles()).unwrap();
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  }, [dispatch]);

  const changeUserRoles = useCallback(
    async (userId: string, roleIds: string[]) => {
      try {
        await dispatch(updateUserRoles({ userId, roleIds })).unwrap();
        return { success: true };
      } catch (err) {
        return { success: false, error: err as string };
      }
    },
    [dispatch]
  );

  const clearUserError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    users,
    roles,
    loading,
    error,
    getUsers,
    getRoles,
    changeUserRoles,
    clearUserError,
  };
};

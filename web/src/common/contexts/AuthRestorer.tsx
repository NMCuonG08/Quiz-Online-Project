"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  restoreAuth,
  getUserProfile,
} from "@/modules/auth/common/slices/authSlice";

/**
 * Component to restore auth state from localStorage on app startup
 * This handles token restoration since token is now persisted to localStorage
 */
export default function AuthRestorer({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated, user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Restore the access token first. The profile effect below then restores
    // the user object, which is required by user-scoped features such as AI
    // chat history.
    dispatch(restoreAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated || !token || user) return;
    void dispatch(getUserProfile())
      .unwrap()
      .catch(() => {
        // The Axios interceptor handles 401 → refresh → logout. Keep the
        // token untouched for transient network failures.
        console.warn("Could not restore authenticated user profile.");
      });
  }, [dispatch, isAuthenticated, token, user]);

  return <>{children}</>;
}

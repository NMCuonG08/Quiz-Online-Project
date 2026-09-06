"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  restoreAuth,
  getUserProfile,
  tokenRefreshed,
  forceLogout,
} from "@/modules/auth/common/slices/authSlice";
import { wsManager } from "@/lib/websocket";

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
    const handleTokenRefreshed = (event: Event) => {
      const nextToken = (event as CustomEvent<{ token?: string }>).detail?.token;
      if (!nextToken) return;
      dispatch(tokenRefreshed(nextToken));
      void wsManager.connect(nextToken);
    };
    window.addEventListener("auth-token-refreshed", handleTokenRefreshed);
    return () => window.removeEventListener("auth-token-refreshed", handleTokenRefreshed);
  }, [dispatch]);

  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(forceLogout());
    };
    window.addEventListener("auth-session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth-session-expired", handleSessionExpired);
  }, [dispatch]);

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

"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  restoreAuth,
  forceLogout,
} from "@/modules/auth/common/slices/authSlice";
import { initWebSocket } from "@/common/middlewares/websocket.middleware";

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
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    // Always try to restore auth state on mount
    // This ensures we have the latest state from sessionStorage
    dispatch(restoreAuth());
  }, [dispatch]);

  // Single effect to handle WebSocket initialization after auth restore
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log("🔌 Auth state ready, initializing WebSocket...");
      // Single timeout to prevent multiple triggers
      const timeoutId = setTimeout(() => {
        dispatch(initWebSocket());
      }, 1000); // Wait 1 second for auth state to stabilize

      return () => clearTimeout(timeoutId);
    }
  }, [dispatch, isAuthenticated, token]); // Only trigger when auth state is actually ready

  // Force logout if isAuthenticated but no token
  useEffect(() => {
    if (isAuthenticated && !token) {
      console.log("🚫 Authenticated but no token, forcing logout...");
      dispatch(forceLogout());
    }
  }, [dispatch, isAuthenticated, token]);

  return <>{children}</>;
}

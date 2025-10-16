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

    // Trigger WebSocket initialization after auth restore
    // Đợi lâu hơn để đảm bảo auth state được restore hoàn toàn
    setTimeout(() => {
      dispatch(initWebSocket());
    }, 500);
  }, [dispatch]);

  // Re-trigger WebSocket when auth state changes
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log("🔌 Auth state changed, re-triggering WebSocket...");
      setTimeout(() => {
        dispatch(initWebSocket());
      }, 100);
    }
  }, [dispatch, isAuthenticated, token]);

  // Force logout if isAuthenticated but no token
  useEffect(() => {
    if (isAuthenticated && !token) {
      console.log("🚫 Authenticated but no token, forcing logout...");
      dispatch(forceLogout());
    }
  }, [dispatch, isAuthenticated, token]);

  return <>{children}</>;
}

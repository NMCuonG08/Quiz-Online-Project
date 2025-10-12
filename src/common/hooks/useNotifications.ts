import { useCallback, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  addNotification,
  markAsRead,
  removeNotification,
  clearAll,
} from "@/common/slices/notification.slice";
import { wsManager } from "@/lib/websocket";
import type { NotificationItem } from "@/common/types";

export function useNotifications() {
  const dispatch = useAppDispatch();
  const isMountedRef = useRef(false);

  const notifications = useAppSelector((state) => state.notifications.items);
  const unreadCount = useAppSelector(
    (state) => state.notifications.unreadCount
  );
  const { isConnected, isConnecting, error } = useAppSelector(
    (state) => state.websocket
  );

  // Tạo notification local
  const createNotification = useCallback(
    (
      type: NotificationItem["type"],
      title: string,
      message: string,
      userId?: string
    ) => {
      // Chỉ tạo notification khi component đã mount (client-side)
      if (typeof window === "undefined") return null;

      isMountedRef.current = true;

      const notification: NotificationItem = {
        id: `local-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
        type,
        title,
        message,
        userId: userId || "current-user",
        timestamp: new Date().toISOString(),
        read: false,
        autoRemove: type === "success",
        duration: 5,
      };

      dispatch(addNotification(notification));

      // Auto remove
      if (notification.autoRemove) {
        setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration! * 1000);
      }

      return notification.id;
    },
    [dispatch]
  );

  const markAsReadHandler = useCallback(
    (id: string) => {
      dispatch(markAsRead(id));
    },
    [dispatch]
  );

  const removeHandler = useCallback(
    (id: string) => {
      dispatch(removeNotification(id));
    },
    [dispatch]
  );

  const clearAllHandler = useCallback(() => {
    dispatch(clearAll());
  }, [dispatch]);

  // WebSocket actions
  const sendMessage = useCallback(
    (event: string, ...args: unknown[]) => {
      if (isConnected) {
        wsManager.send(event as keyof typeof wsManager, ...args);
      }
    },
    [isConnected]
  );

  return {
    // State
    notifications,
    unreadCount,
    isConnected,
    isConnecting,
    error,

    // Actions
    createNotification,
    markAsRead: markAsReadHandler,
    removeNotification: removeHandler,
    clearAll: clearAllHandler,
    sendMessage,

    // Quick helpers
    success: (title: string, message: string) =>
      createNotification("success", title, message),
    error: (title: string, message: string) =>
      createNotification("error", title, message),
    warning: (title: string, message: string) =>
      createNotification("warning", title, message),
    info: (title: string, message: string) =>
      createNotification("info", title, message),
  };
}

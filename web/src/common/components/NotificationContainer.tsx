"use client";

import { useNotifications } from "@/common/hooks/useNotifications";
import { NotificationToast } from "@/common/components/NotificationToast";

export function NotificationContainer() {
  const { notifications, removeNotification, markAsRead, isConnected } =
    useNotifications();

  return (
    <>
      {/* Connection indicator */}
      {/* <div className="fixed top-2 right-2 z-50">
        <div
          className={`px-2 py-1 rounded text-xs text-white ${isConnected ? "bg-green-500" : "bg-red-500"
            }`}
        >
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </div>
      </div> */}

      {/* Notification toasts */}
      <div className="fixed top-4 right-4 z-40 w-80">
        {notifications.slice(0, 5).map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
            onMarkRead={markAsRead}
          />
        ))}
      </div>
    </>
  );
}

"use client";

import { useEffect } from "react";
import { NotificationItem } from "@/common/types";

interface Props {
  notification: NotificationItem;
  onRemove: (id: string) => void;
  onMarkRead: (id: string) => void;
}

export function NotificationToast({
  notification,
  onRemove,
  onMarkRead,
}: Props) {
  useEffect(() => {
    if (notification.autoRemove && notification.duration) {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration * 1000);
      return () => clearTimeout(timer);
    }
  }, [notification, onRemove]);

  const handleClick = () => {
    if (!notification.read) {
      onMarkRead(notification.id);
    }
  };

  const getStyle = () => {
    const base =
      "p-4 mb-2 rounded-lg shadow-lg text-white cursor-pointer transform transition-all hover:scale-105";
    const opacity = notification.read ? "opacity-75" : "opacity-100";

    switch (notification.type) {
      case "success":
        return `${base} bg-green-500 ${opacity}`;
      case "error":
        return `${base} bg-red-500 ${opacity}`;
      case "warning":
        return `${base} bg-yellow-500 ${opacity}`;
      case "info":
        return `${base} bg-blue-500 ${opacity}`;
      default:
        return `${base} bg-gray-500 ${opacity}`;
    }
  };

  return (
    <div className={getStyle()} onClick={handleClick}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold">{notification.title}</h4>
          <p className="text-sm opacity-90">{notification.message}</p>
          <span className="text-xs opacity-70">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center ml-4">
          {!notification.read && (
            <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(notification.id);
            }}
            className="opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

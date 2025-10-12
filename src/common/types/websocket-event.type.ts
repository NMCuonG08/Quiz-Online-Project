export interface ClientEventMap {
  on_user_delete: [string];
  on_asset_delete: [string];
  on_notification: [ServerNotification];
  // Thêm events khác từ backend EventRepository
}

export interface ServerEventMap {
  join_room: [string];
  leave_room: [string];
  mark_notification_read: [string];
}

// Notification types
export interface ServerNotification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  userId: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface NotificationItem extends ServerNotification {
  autoRemove?: boolean;
  duration?: number;
}

export interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

// WebSocket state
export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
}

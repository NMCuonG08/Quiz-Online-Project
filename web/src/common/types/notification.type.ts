export interface NotificationItem {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  userId: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  autoRemove?: boolean;
  duration?: number;
}

export interface NotificationState {
  items: NotificationItem[];
  unreadCount: number;
}

export * from "./notification.type";
export * from "./websocket-event.type";

// Re-export commonly used types
export type { NotificationItem, NotificationState } from "./notification.type";
export type {
  ServerNotification,
  ClientEventMap,
  ServerEventMap,
} from "./websocket-event.type";

// Type alias for WebSocket notification data
export type NotificationData = ServerNotification;

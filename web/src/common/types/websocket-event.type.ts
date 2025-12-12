// Room-related types
export interface RoomJoinedPayload {
  success: boolean;
  roomId: string;
  socketRoom: string;
  message: string;
}

export interface RoomLeftPayload {
  success: boolean;
  roomId: string;
  message: string;
}

export interface RoomErrorPayload {
  success: boolean;
  roomId: string;
  error: string;
}

export interface UserRoomPayload {
  userId: string;
  roomId: string;
  message: string;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  user_id: string;
  username: string;
  message: string;
  message_type: "text" | "system" | "notification";
  created_at: string;
}

export interface Participant {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  joined_at: string;
  is_ready: boolean;
  is_host: boolean;
}

export interface RoomData {
  id: string;
  quiz_id: string;
  owner_id: string;
  room_code: string;
  status: "OPEN" | "CLOSED" | "ONGOING";
  is_private: boolean;
  max_participants: number;
  current_participants: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ClientEventMap {
  on_user_delete: [string];
  on_asset_delete: [string];
  on_notification: [ServerNotification];
  // Room events from backend
  room_joined: [RoomJoinedPayload];
  room_left: [RoomLeftPayload];
  room_join_error: [RoomErrorPayload];
  room_leave_error: [RoomErrorPayload];
  user_joined: [UserRoomPayload];
  user_left: [UserRoomPayload];
  // Chat and participants events
  room_message: [ChatMessage];
  messages_list: [ChatMessage[]];
  participant_joined: [Participant];
  participant_left: [string];
  participants_list: [{ roomId: string; participants: Participant[] }];
  room_updated: [RoomData];
}

export interface ServerEventMap {
  join_room: [{ roomId: string }];
  leave_room: [{ roomId: string }];
  mark_notification_read: [string];
  get_messages: [{ roomId: string }];
  send_message: [{ roomId: string; message: string }];
  get_participants: [{ roomId: string }];
  invite_friends: [{ roomId: string; friendIds: string[] }];
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

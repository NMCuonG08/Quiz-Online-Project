import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

// Types matching backend DTOs
export type NotificationType = "INFO" | "WARNING" | "ERROR" | "SUCCESS";
export type NotificationStatus = "UNREAD" | "READ" | "ARCHIVED";

export interface ServerNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  status?: NotificationStatus;
  is_read: boolean;
  user_id?: string;
  action_url?: string;
  action_text?: string;
  created_at: string;
  updated_at: string;
  read_at?: string | null;
}

export interface NotificationsResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
  data?: ServerNotification[];
  error?: { message: string };
}

export interface UnreadCountResponse {
  success: boolean;
  data?: { count: number };
  count?: number;
  error?: { message: string };
}

export interface PaginatedNotificationsResponse {
  success: boolean;
  items: ServerNotification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  error?: { message: string };
}

export class NotificationApiService {
  /**
   * Get paginated notifications for a user
   */
  static async getByUserId(
    userId: string,
    page = 1,
    limit = 8
  ): Promise<PaginatedNotificationsResponse> {
    try {
      const response = await apiClient.get(
        `${apiRoutes.NOTIFICATIONS.GET_BY_USER(userId)}?page=${page}&limit=${limit}`
      );
      const responseData = response.data;

      // Handle paginated response: { items: [...], pagination: {...} }
      // or wrapped: { data: { items: [...], pagination: {...} } }
      const payload = responseData?.data || responseData;

      if (payload?.items) {
        return {
          success: true,
          items: payload.items,
          pagination: payload.pagination,
        };
      }

      // Fallback: direct array response (non-paginated)
      const items = Array.isArray(payload) ? payload : [];
      return { success: true, items };
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown } };
      return (
        (err.response?.data as PaginatedNotificationsResponse) || {
          success: false,
          items: [],
          error: { message: "Failed to fetch notifications" },
        }
      );
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await apiClient.get(
        apiRoutes.NOTIFICATIONS.UNREAD_COUNT(userId)
      );
      const responseData = response.data;
      // Handle { count: N } or { data: { count: N } }
      return responseData?.data?.count ?? responseData?.count ?? 0;
    } catch {
      return 0;
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(id: string): Promise<boolean> {
    try {
      await apiClient.put(apiRoutes.NOTIFICATIONS.MARK_READ(id));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      await apiClient.put(apiRoutes.NOTIFICATIONS.MARK_ALL_READ(userId));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(id: string): Promise<boolean> {
    try {
      await apiClient.delete(apiRoutes.NOTIFICATIONS.DELETE(id));
      return true;
    } catch {
      return false;
    }
  }
}

import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export interface CreateRoomPayload {
  quiz_id: string;
  room_code: string; // exactly 6 digits (UI enforces)
  is_private: boolean;
  password?: string;
  max_participants: number;
}

export interface CreateRoomResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    id: string;
    room_code: string;
  };
  error?: { message: string };
}

export class RoomService {
  static async create(payload: CreateRoomPayload): Promise<CreateRoomResponse> {
    const res = await apiClient.post(apiRoutes.ROOMS.CREATE, payload);
    return res.data as CreateRoomResponse;
  }

  static async listByQuiz(
    quizId: string,
    status: "OPEN" | "CLOSED" | "ONGOING" | string = "OPEN"
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data: {
      items: Array<{
        id: string;
        quiz_id: string;
        owner_id: string;
        room_code: string;
        status: string;
        is_private: boolean;
        password_hash: string | null;
        max_participants: number;
        current_participants: number;
        settings: Record<string, unknown>;
        created_at: string;
        updated_at: string;
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalItems: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    };
  }> {
    const res = await apiClient.get(apiRoutes.ROOMS.BY_QUIZ(quizId, status));
    return res.data;
  }

  static async join(
    roomId: string,
    payload: { password?: string }
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { id: string };
    error?: { message: string };
  }> {
    const res = await apiClient.post(apiRoutes.ROOMS.JOIN(roomId), payload);
    return res.data;
  }
}

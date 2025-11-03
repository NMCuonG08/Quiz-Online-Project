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
    try {
      // Validate quizId
      if (!quizId || quizId.trim() === "") {
        throw new Error("Quiz ID is required");
      }

      // Check if quizId is a UUID or slug
      const isUUID =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          quizId
        );

      console.log(
        "🔍 RoomService: Fetching rooms for quizId:",
        quizId,
        "status:",
        status,
        "isUUID:",
        isUUID
      );

      const url = isUUID
        ? apiRoutes.ROOMS.BY_QUIZ(quizId, status)
        : apiRoutes.ROOMS.BY_QUIZ_SLUG(quizId, status);
      console.log("📡 RoomService: API URL:", url);

      const res = await apiClient.get(url);
      console.log("✅ RoomService: Response:", res.data);

      return res.data;
    } catch (error: unknown) {
      console.error("❌ RoomService: Error fetching rooms:", error);

      // Check if it's a 500 error from backend
      const axiosError = error as {
        response?: { status?: number; data?: any };
      };
      if (axiosError.response?.status === 500) {
        console.warn(
          "🔄 Backend returned 500 error, returning empty rooms list"
        );
        return {
          success: true, // Return success to prevent UI crash
          statusCode: 200,
          message: "No rooms available (backend error)",
          data: {
            items: [],
            pagination: {
              page: 1,
              limit: 10,
              total: 0,
              totalItems: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          },
        };
      }

      // Return a fallback response for other errors
      return {
        success: false,
        statusCode: 500,
        message: "Failed to fetch rooms",
        data: {
          items: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalItems: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      };
    }
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

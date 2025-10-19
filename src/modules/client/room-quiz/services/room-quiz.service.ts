import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { type QuizDetailData } from "@/modules/client/quiz/services/quiz.detail.service";

export interface RoomQuizData {
  id: string;
  quiz_id: string;
  owner_id: string;
  room_code: string;
  status: "OPEN" | "CLOSED" | "ONGOING";
  is_private: boolean;
  password_hash: string | null;
  max_participants: number;
  current_participants: number;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  quiz?: QuizDetailData;
}

export interface GetRoomResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: RoomQuizData;
}

export interface JoinRoomPayload {
  password?: string;
}

export interface JoinRoomResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data?: { id: string };
  error?: { message: string };
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

export interface ChatMessagesResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ChatMessage[];
}

export interface ParticipantsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Participant[];
}

export class RoomQuizService {
  static async getRoomById(roomId: string): Promise<GetRoomResponse> {
    const res = await apiClient.get(`${apiRoutes.ROOMS.BASE}/${roomId}`);
    const roomData = res.data as GetRoomResponse;

    // If room has quiz_id, fetch quiz details
    if (roomData.success && roomData.data?.quiz_id) {
      try {
        const quizResponse = await apiClient.get(
          `${apiRoutes.QUIZZES.BASE}/${roomData.data.quiz_id}`
        );
        if (quizResponse.data?.success && quizResponse.data?.data) {
          roomData.data.quiz = quizResponse.data.data as QuizDetailData;
        }
      } catch (error) {
        console.warn("Failed to fetch quiz details:", error);
      }
    }

    return roomData;
  }

  static async joinRoom(
    roomId: string,
    payload: JoinRoomPayload
  ): Promise<JoinRoomResponse> {
    const res = await apiClient.post(apiRoutes.ROOMS.JOIN(roomId), payload);
    return res.data as JoinRoomResponse;
  }

  static async getRoomByCode(roomCode: string): Promise<GetRoomResponse> {
    const res = await apiClient.get(apiRoutes.ROOMS.BY_CODE(roomCode));
    return res.data as GetRoomResponse;
  }

  static generateRoomUrl(roomCode: string): string {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    return `${baseUrl}/room/${roomCode}`;
  }

  static async getChatMessages(roomId: string): Promise<ChatMessagesResponse> {
    const res = await apiClient.get(
      `${apiRoutes.ROOMS.BASE}/${roomId}/messages`
    );
    return res.data as ChatMessagesResponse;
  }

  static async sendMessage(
    roomId: string,
    message: string
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: ChatMessage;
    error?: { message: string };
  }> {
    const res = await apiClient.post(
      `${apiRoutes.ROOMS.BASE}/${roomId}/messages`,
      {
        message,
      }
    );
    return res.data;
  }

  static async getParticipants(roomId: string): Promise<ParticipantsResponse> {
    const res = await apiClient.get(
      `${apiRoutes.ROOMS.BASE}/${roomId}/participants`
    );
    return res.data as ParticipantsResponse;
  }

  static async inviteFriends(
    roomId: string,
    friendIds: string[]
  ): Promise<{
    success: boolean;
    statusCode: number;
    message: string;
    data?: { invited_count: number };
    error?: { message: string };
  }> {
    const res = await apiClient.post(
      `${apiRoutes.ROOMS.BASE}/${roomId}/invite`,
      {
        friend_ids: friendIds,
      }
    );
    return res.data;
  }
}

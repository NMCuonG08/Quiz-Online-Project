import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export type Message = { id: string; conversation_id: string; sender_id: string; body: string; type: string; created_at: string; sender?: { id: string; username?: string | null; full_name?: string | null } };
export type Conversation = { id: string; members: Array<{ user_id: string; user?: { id: string; username?: string | null; full_name?: string | null; avatar?: string | null } }>; messages: Message[] };

export class MessagingService {
  static async list(): Promise<Conversation[]> { const response = await apiClient.get(apiRoutes.MESSAGING.CONVERSATIONS); return response.data?.data ?? response.data ?? []; }
  static async create(otherUserId: string): Promise<Conversation> { const response = await apiClient.post(apiRoutes.MESSAGING.CONVERSATIONS, { otherUserId }); return response.data?.data ?? response.data; }
  static async messages(id: string): Promise<Message[]> { const response = await apiClient.get(apiRoutes.MESSAGING.MESSAGES(id)); return response.data?.data ?? response.data ?? []; }
  static async send(id: string, body: string): Promise<Message> { const response = await apiClient.post(apiRoutes.MESSAGING.SEND(id), { body, clientMessageId: crypto.randomUUID() }); return response.data?.data ?? response.data; }
  static async read(id: string) { await apiClient.patch(apiRoutes.MESSAGING.READ(id)); }
}

import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export interface FriendUser {
  id: string;
  username?: string | null;
  full_name?: string | null;
  avatar?: string | null;
  relationshipStatus?: string;
  friendshipId?: string | null;
}

export interface FriendListItem {
  friendshipId: string;
  friendsSince: string;
  friend: FriendUser;
}

export interface FriendshipRequest {
  id: string;
  userId: string;
  friendId: string;
  status: string;
  user: FriendUser;
  friend?: FriendUser;
}

export class FriendshipService {
  static async sendRequest(friendId: string) {
    return apiClient.post(apiRoutes.FRIENDSHIPS.REQUEST, { friendId });
  }

  static async acceptRequest(friendshipId: string) {
    return apiClient.post(apiRoutes.FRIENDSHIPS.ACCEPT(friendshipId));
  }

  static async removeFriendOrReject(friendshipId: string) {
    return apiClient.delete(apiRoutes.FRIENDSHIPS.DELETE(friendshipId));
  }

  static async getFriends(): Promise<{ data: FriendListItem[] }> {
    const res = await apiClient.get(apiRoutes.FRIENDSHIPS.FRIENDS);
    return { data: res.data?.data || [] };
  }

  static async getPendingRequests(): Promise<{ data: FriendshipRequest[] }> {
    const res = await apiClient.get(apiRoutes.FRIENDSHIPS.PENDING);
    return { data: res.data?.data || [] };
  }

  static async getSentRequests(): Promise<{ data: FriendshipRequest[] }> {
    const res = await apiClient.get(apiRoutes.FRIENDSHIPS.SENT);
    return { data: res.data?.data || [] };
  }

  static async searchUsers(query: string): Promise<{ data: FriendUser[] }> {
    const res = await apiClient.get(apiRoutes.USER.SEARCH, { params: { q: query } });
    return { data: res.data?.data || [] };
  }
}

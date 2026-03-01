import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export interface Post {
  id: string;
  userId: string;
  content: string;
  image_url?: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar: string;
  };
  _count: {
    comments: number;
    likes: number;
  };
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar: string;
  };
}

export class CommunityService {
  static async getPosts(page = 1, limit = 10): Promise<{ data: Post[] }> {
    const res = await apiClient.get(apiRoutes.COMMUNITY.POSTS, { params: { page, limit } });
    return { data: res.data?.data || [] };
  }

  static async createPost(content: string, image_url?: string): Promise<{ data: Post }> {
    const res = await apiClient.post(apiRoutes.COMMUNITY.POSTS, { content, image_url });
    return { data: res.data?.data };
  }

  static async deletePost(id: string) {
    const res = await apiClient.delete(apiRoutes.COMMUNITY.POST_BY_ID(id));
    return res.data;
  }

  static async getComments(postId: string): Promise<{ data: Comment[] }> {
    const res = await apiClient.get(apiRoutes.COMMUNITY.POST_COMMENTS(postId));
    return { data: res.data?.data || [] };
  }

  static async createComment(postId: string, content: string): Promise<{ data: Comment }> {
    const res = await apiClient.post(apiRoutes.COMMUNITY.COMMENTS, { postId, content });
    return { data: res.data?.data };
  }

  static async toggleLike(postId: string): Promise<{ data: { liked: boolean } }> {
    const res = await apiClient.post(apiRoutes.COMMUNITY.TOGGLE_LIKE, { postId });
    return { data: res.data?.data };
  }
}

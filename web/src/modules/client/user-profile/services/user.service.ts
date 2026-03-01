import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export interface UpdateUserProfileDto {
  username?: string;
  fullName?: string;
  age?: number;
  avatar?: string;
}

export class UserService {
  static async updateProfile(id: string, data: UpdateUserProfileDto) {
    try {
      const response = await apiClient.patch(apiRoutes.USERS.UPDATE(id), data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to update profile",
      };
    }
  }
}

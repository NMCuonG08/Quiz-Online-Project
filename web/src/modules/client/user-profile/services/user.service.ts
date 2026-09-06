import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export interface UpdateUserProfileDto {
  username?: string;
  fullName?: string;
  age?: number;
  avatar?: string;
}

export class UserService {
  static async updateProfile(data: UpdateUserProfileDto) {
    try {
      const response = await apiClient.patch(apiRoutes.USER.ME, data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Failed to update profile",
      };
    }
  }

  static async updateAvatar(file: File) {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await apiClient.patch(apiRoutes.USER.AVATAR, formData);
      return { success: true, data: response.data?.data ?? response.data };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err.response?.data?.message || "Không thể tải ảnh đại diện lên",
      };
    }
  }
}

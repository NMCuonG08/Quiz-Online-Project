import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export class AdminUserService {
  static async getUsers() {
    try {
      const response = await apiClient.get(apiRoutes.USERS.GET_ALL);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: "Failed to fetch users" };
    }
  }

  static async getRoles() {
    try {
      const response = await apiClient.get(apiRoutes.USERS.ROLES);
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: "Failed to fetch roles" };
    }
  }

  static async updateUserRoles(userId: string, roleIds: string[]) {
    try {
      const response = await apiClient.patch(apiRoutes.USERS.UPDATE_ROLES(userId), {
        roleIds,
      });
      return response.data;
    } catch (error: any) {
      return error.response?.data || { success: false, message: "Failed to update user roles" };
    }
  }
}

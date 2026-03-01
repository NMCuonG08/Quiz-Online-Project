import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { AdminCourse, CourseCreateData, CourseUpdateData } from "../types/course.type";

export class AdminCourseService {
  static async getAllCourses(): Promise<{ success: boolean; data?: AdminCourse[]; error?: string }> {
    try {
      // Backend returns either data or { data, meta } depending on pagination
      const response = await apiClient.get(apiRoutes.COURSES.GET_ALL);
      const items = response.data?.data || response.data || [];
      return { success: true, data: items };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to fetch courses" };
    }
  }

  static async createCourse(data: CourseCreateData): Promise<{ success: boolean; data?: AdminCourse; error?: string }> {
    try {
      const response = await apiClient.post(apiRoutes.COURSES.CREATE, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to create course" };
    }
  }

  static async updateCourse(id: string, data: CourseUpdateData): Promise<{ success: boolean; data?: AdminCourse; error?: string }> {
    try {
      const response = await apiClient.patch(apiRoutes.COURSES.UPDATE_BY_ID(id), data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to update course" };
    }
  }

  static async deleteCourse(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await apiClient.delete(apiRoutes.COURSES.DELETE_BY_ID(id));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to delete course" };
    }
  }
}

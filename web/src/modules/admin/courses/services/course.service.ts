import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { AdminCourse, CourseCreateData, CourseUpdateData } from "../types/course.type";

export class AdminCourseService {
  static async getAllCourses(page: number = 1, limit: number = 10): Promise<{ success: boolean; data?: { data: AdminCourse[]; meta: any }; error?: string }> {
    try {
      const response = await apiClient.get(`${apiRoutes.COURSES.GET_ALL}?page=${page}&limit=${limit}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to fetch courses" };
    }
  }

  static async getCourseById(id: string): Promise<{ success: boolean; data?: AdminCourse; error?: string }> {
    try {
      const response = await apiClient.get(apiRoutes.COURSES.GET_BY_ID(id));
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to fetch course details" };
    }
  }

  static async createCourse(data: CourseCreateData): Promise<{ success: boolean; data?: AdminCourse; error?: string }> {
    try {
      let body: FormData | Record<string, unknown>;
      if (data.thumbnailFile) {
        const form = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (key === "thumbnailFile") return;
          if (value !== undefined && value !== null) {
            form.append(key, String(value));
          }
        });
        form.append("thumbnail", data.thumbnailFile);
        body = form;
      } else {
        const { thumbnailFile: _thumbnail, ...jsonBody } = data;
        body = jsonBody as Record<string, unknown>;
      }

      const response = await apiClient.post(apiRoutes.COURSES.CREATE, body);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || "Failed to create course" };
    }
  }

  static async updateCourse(id: string, data: CourseUpdateData): Promise<{ success: boolean; data?: AdminCourse; error?: string }> {
    try {
      let body: FormData | Record<string, unknown>;
      if (data.thumbnailFile) {
        const form = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (key === "thumbnailFile") return;
          if (value !== undefined && value !== null) {
            form.append(key, String(value));
          }
        });
        form.append("thumbnail", data.thumbnailFile);
        body = form;
      } else {
        const { thumbnailFile: _thumbnail, ...jsonBody } = data;
        body = jsonBody as Record<string, unknown>;
      }

      const response = await apiClient.patch(apiRoutes.COURSES.UPDATE_BY_ID(id), body);
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

import { apiClient } from "@/lib/api";

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon_url: string;
  description: string;
}

export interface CategoryResponse {
  data?: Category[];
  error?: {
    message: string;
    code: string;
  };
}

export class CategoryService {
  // Lấy danh sách tất cả categories
  static async getCategories(): Promise<CategoryResponse> {
    try {
      console.log("Fetching categories...");
      const response = await apiClient.get("/categories");
      console.log("Categories API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get categories error:", error);
      return (
        error.response?.data || {
          error: {
            message: "Failed to fetch categories",
            code: "CATEGORIES_ERROR",
          },
        }
      );
    }
  }

  // Lấy category theo slug
  static async getCategoryBySlug(slug: string): Promise<CategoryResponse> {
    try {
      console.log(`Fetching category by slug: ${slug}`);
      const response = await apiClient.get(`/categories/${slug}`);
      console.log("Category API response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get category by slug error:", error);
      return (
        error.response?.data || {
          error: {
            message: "Failed to fetch category",
            code: "CATEGORY_ERROR",
          },
        }
      );
    }
  }
}

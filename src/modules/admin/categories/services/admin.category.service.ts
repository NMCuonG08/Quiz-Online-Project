import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon_url: string;
  description: string;
  // Optional fields commonly present on server
  is_active?: boolean | null;
  parent_id?: number | null;
  created_at?: string;
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
      const response = await apiClient.get(apiRoutes.CATEGORIES.GET_ALL);
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
      const response = await apiClient.get(
        apiRoutes.CATEGORIES.GET_BY_SLUG(slug)
      );
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

  // Tạo mới category
  static async createCategory(payload: {
    name: string;
    slug: string;
    description?: string;
    isActive?: boolean;
    parentId?: string | number | null;
    iconFile?: File | null;
  }): Promise<CategoryResponse> {
    try {
      console.log("Creating category, raw payload:", payload);
      let body: FormData | Record<string, unknown>;
      if (payload.iconFile) {
        const form = new FormData();
        // Map camelCase -> server snake_case
        form.append("name", String(payload.name ?? ""));
        form.append("slug", String(payload.slug ?? ""));
        form.append("description", String(payload.description ?? ""));
        form.append("is_active", String(payload.isActive ?? true));
        if (
          payload.parentId !== undefined &&
          payload.parentId !== null &&
          payload.parentId !== ""
        ) {
          form.append("parent_id", String(payload.parentId));
        }
        form.append("icon", payload.iconFile);
        console.log("createCategory FormData entries:");
        for (const [k, v] of form.entries()) {
          console.log("  ", k, v);
        }
        body = form;
      } else {
        const jsonBody: Record<string, unknown> = {
          name: payload.name,
          slug: payload.slug,
          description: payload.description ?? "",
          is_active: payload.isActive ?? true,
        };
        if (
          payload.parentId !== undefined &&
          payload.parentId !== null &&
          payload.parentId !== ""
        ) {
          jsonBody.parent_id = payload.parentId;
        }
        console.log("createCategory JSON body:", jsonBody);
        body = jsonBody;
      }
      const response = await apiClient.post(apiRoutes.CATEGORIES.CREATE, body);
      return response.data;
    } catch (error) {
      console.error("Create category error:", error);
      return (
        error.response?.data || {
          error: {
            message: "Failed to create category",
            code: "CATEGORY_CREATE_ERROR",
          },
        }
      );
    }
  }

  // Cập nhật category theo ID
  static async updateCategoryById(
    id: string | number,
    payload: {
      name?: string;
      slug?: string;
      description?: string;
      isActive?: boolean;
      parentId?: string | number | null;
      iconFile?: File | null;
    }
  ): Promise<CategoryResponse> {
    try {
      console.log("Updating category id=", id, "raw payload:", payload);
      let body: FormData | Record<string, unknown>;
      if (payload.iconFile) {
        const form = new FormData();
        if (payload.name !== undefined)
          form.append("name", String(payload.name));
        if (payload.slug !== undefined)
          form.append("slug", String(payload.slug));
        if (payload.description !== undefined)
          form.append("description", String(payload.description));
        if (payload.isActive !== undefined)
          form.append("is_active", String(payload.isActive));
        if (
          payload.parentId !== undefined &&
          payload.parentId !== null &&
          payload.parentId !== ""
        )
          form.append("parent_id", String(payload.parentId));
        form.append("icon", payload.iconFile);
        console.log("updateCategory FormData entries:");
        for (const [k, v] of form.entries()) {
          console.log("  ", k, v);
        }
        body = form;
      } else {
        const jsonBody: Record<string, unknown> = {};
        if (payload.name !== undefined) jsonBody.name = payload.name;
        if (payload.slug !== undefined) jsonBody.slug = payload.slug;
        if (payload.description !== undefined)
          jsonBody.description = payload.description;
        if (payload.isActive !== undefined)
          jsonBody.is_active = payload.isActive;
        if (
          payload.parentId !== undefined &&
          payload.parentId !== null &&
          payload.parentId !== ""
        )
          jsonBody.parent_id = payload.parentId;
        console.log("updateCategory JSON body:", jsonBody);
        body = jsonBody;
      }
      const response = await apiClient.patch(
        apiRoutes.CATEGORIES.UPDATE_BY_ID(id),
        body
      );
      return response.data;
    } catch (error) {
      console.error("Update category error:", error);
      return (
        error.response?.data || {
          error: {
            message: "Failed to update category",
            code: "CATEGORY_UPDATE_ERROR",
          },
        }
      );
    }
  }

  // Xoá category theo ID
  static async deleteCategoryById(
    id: string | number
  ): Promise<CategoryResponse> {
    try {
      console.log("Deleting category id=", id);
      const response = await apiClient.delete(
        apiRoutes.CATEGORIES.DELETE_BY_ID(id)
      );
      return response.data;
    } catch (error) {
      console.error("Delete category error:", error);
      return (
        error.response?.data || {
          error: {
            message: "Failed to delete category",
            code: "CATEGORY_DELETE_ERROR",
          },
        }
      );
    }
  }
}

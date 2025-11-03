import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { CategoryService, Category } from "../services/admin.category.service";

interface CategoryState {
  categories: Category[];
  currentCategory: Category | null;
  loading: boolean;
  error: string | null;
}

const initialState: CategoryState = {
  categories: [],
  currentCategory: null,
  loading: false,
  error: null,
};

// Async thunk để lấy danh sách categories
export const fetchCategories = createAsyncThunk(
  "category/fetchCategories",
  async (_, { rejectWithValue }) => {
    const response = await CategoryService.getCategories();
    console.log("Fetch categories response:", response);

    // Kiểm tra nếu có error trong response
    if (response.error) {
      return rejectWithValue(
        response.error.message || "Failed to fetch categories"
      );
    }

    return response.data || response;
  }
);

// Async thunk để lấy category theo slug
export const fetchCategoryBySlug = createAsyncThunk(
  "category/fetchCategoryBySlug",
  async (slug: string, { rejectWithValue }) => {
    const response = await CategoryService.getCategoryBySlug(slug);
    console.log("Fetch category by slug response:", response);

    // Kiểm tra nếu có error trong response
    if (response.error) {
      return rejectWithValue(
        response.error.message || "Failed to fetch category"
      );
    }

    return response.data || response;
  }
);

// Tạo category
export const createCategory = createAsyncThunk(
  "category/createCategory",
  async (
    payload: {
      name: string;
      slug: string;
      description?: string;
      isActive?: boolean;
      parentId?: string | number | null;
      iconFile?: File | null;
    },
    { rejectWithValue }
  ) => {
    const response = await CategoryService.createCategory(payload);
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data;
  }
);

// Cập nhật category
export const updateCategory = createAsyncThunk(
  "category/updateCategory",
  async (
    {
      id,
      data,
    }: {
      id: string | number;
      data: {
        name?: string;
        slug?: string;
        description?: string;
        isActive?: boolean;
        parentId?: string | number | null;
        iconFile?: File | null;
      };
    },
    { rejectWithValue }
  ) => {
    const response = await CategoryService.updateCategoryById(id, data);
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data;
  }
);

// Xoá category
export const deleteCategory = createAsyncThunk(
  "category/deleteCategory",
  async (id: string | number, { rejectWithValue }) => {
    const response = await CategoryService.deleteCategoryById(id);
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data;
  }
);

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentCategory: (state) => {
      state.currentCategory = null;
    },
    clearCategories: (state) => {
      state.categories = [];
      state.currentCategory = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch category by slug
      .addCase(fetchCategoryBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryBySlug.fulfilled, (state, action) => {
        state.currentCategory = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCategoryBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create category
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        const newItem = action.payload as Category;
        if (newItem) {
          state.categories = [newItem, ...state.categories];
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string })?.message ||
          String(action.payload);
      })
      // Update category
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const updated = action.payload as Category;
        if (updated) {
          state.categories = state.categories.map((c) =>
            c.id === updated.id ? { ...c, ...updated } : c
          );
          if (
            state.currentCategory &&
            state.currentCategory.id === updated.id
          ) {
            state.currentCategory = { ...state.currentCategory, ...updated };
          }
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string })?.message ||
          String(action.payload);
      })
      // Delete category
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        const removed = action.meta.arg as string | number;
        state.categories = state.categories.filter(
          (c) => c.id !== Number(removed)
        );
        if (
          state.currentCategory &&
          state.currentCategory.id === Number(removed)
        ) {
          state.currentCategory = null;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string })?.message ||
          String(action.payload);
      });
  },
});

export const { clearError, clearCurrentCategory, clearCategories } =
  categorySlice.actions;

export default categorySlice.reducer;

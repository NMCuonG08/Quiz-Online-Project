import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { CategoryService, Category } from "@/modules/admin/categories/services/admin.category.service";

interface CourseCategoryState {
  categories: Category[];
  currentCategory: Category | null;
  loading: boolean;
  error: string | null;
}

const initialState: CourseCategoryState = {
  categories: [],
  currentCategory: null,
  loading: false,
  error: null,
};

// Async thunk – fetch all categories (shared endpoint)
export const fetchCourseCategories = createAsyncThunk(
  "courseCategory/fetchCourseCategories",
  async (_, { rejectWithValue }) => {
    const response = await CategoryService.getCategories();
    if (response.error) {
      return rejectWithValue(response.error.message || "Failed to fetch categories");
    }
    return response.data || response;
  }
);

// Async thunk – get by slug
export const fetchCourseCategoryBySlug = createAsyncThunk(
  "courseCategory/fetchCourseCategoryBySlug",
  async (slug: string, { rejectWithValue }) => {
    const response = await CategoryService.getCategoryBySlug(slug);
    if (response.error) {
      return rejectWithValue(response.error.message || "Failed to fetch category");
    }
    return response.data || response;
  }
);

// Create category
export const createCourseCategory = createAsyncThunk(
  "courseCategory/createCourseCategory",
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

// Update category
export const updateCourseCategory = createAsyncThunk(
  "courseCategory/updateCourseCategory",
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

// Delete category
export const deleteCourseCategory = createAsyncThunk(
  "courseCategory/deleteCourseCategory",
  async (id: string | number, { rejectWithValue }) => {
    const response = await CategoryService.deleteCategoryById(id);
    if (response.error) {
      return rejectWithValue(response.error);
    }
    return response.data;
  }
);

const courseCategorySlice = createSlice({
  name: "courseCategory",
  initialState,
  reducers: {
    clearCourseCategoryError: (state) => {
      state.error = null;
    },
    clearCurrentCourseCategory: (state) => {
      state.currentCategory = null;
    },
    clearCourseCategories: (state) => {
      state.categories = [];
      state.currentCategory = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchCourseCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseCategories.fulfilled, (state, action) => {
        state.categories = action.payload as Category[];
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCourseCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch by slug
      .addCase(fetchCourseCategoryBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseCategoryBySlug.fulfilled, (state, action) => {
        state.currentCategory = action.payload as Category;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchCourseCategoryBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createCourseCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCourseCategory.fulfilled, (state, action) => {
        const newItem = action.payload as Category;
        if (newItem) {
          state.categories = [newItem, ...state.categories];
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(createCourseCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string })?.message ||
          String(action.payload);
      })
      // Update
      .addCase(updateCourseCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCourseCategory.fulfilled, (state, action) => {
        const updated = action.payload as Category;
        if (updated) {
          state.categories = state.categories.map((c) =>
            c.id === updated.id ? { ...c, ...updated } : c
          );
          if (state.currentCategory && state.currentCategory.id === updated.id) {
            state.currentCategory = { ...state.currentCategory, ...updated };
          }
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(updateCourseCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string })?.message ||
          String(action.payload);
      })
      // Delete
      .addCase(deleteCourseCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCourseCategory.fulfilled, (state, action) => {
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
      .addCase(deleteCourseCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string })?.message ||
          String(action.payload);
      });
  },
});

export const {
  clearCourseCategoryError,
  clearCurrentCourseCategory,
  clearCourseCategories,
} = courseCategorySlice.actions;

export default courseCategorySlice.reducer;

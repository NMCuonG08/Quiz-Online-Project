import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { CategoryService, Category } from "../services/category.service";

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
      });
  },
});

export const { clearError, clearCurrentCategory, clearCategories } =
  categorySlice.actions;

export default categorySlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  QuizDetailService,
  type QuizDetailData,
} from "../services/quiz.detail.service";

interface QuizDetailState {
  data: QuizDetailData | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuizDetailState = {
  data: null,
  loading: false,
  error: null,
};

export const fetchQuizDetailBySlug = createAsyncThunk(
  "quizDetail/fetchBySlug",
  async (slug: string, { rejectWithValue }) => {
    const response = await QuizDetailService.getBySlug(slug);
    if (!response.success) {
      return rejectWithValue(response.message || "Failed to fetch quiz detail");
    }
    return response.data as QuizDetailData;
  }
);

const quizDetailSlice = createSlice({
  name: "quizDetail",
  initialState,
  reducers: {
    clearQuizDetail: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizDetailBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizDetailBySlug.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchQuizDetailBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch quiz detail";
      });
  },
});

export const { clearQuizDetail } = quizDetailSlice.actions;
export default quizDetailSlice.reducer;

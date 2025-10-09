import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  AdminQuestionService,
  type QuestionItem,
  type QuestionsPagination,
  type QuestionsResponse,
  type QuestionsQueryParams,
} from "../services/admin.question.service";

interface QuestionsState {
  items: QuestionItem[];
  pagination: QuestionsPagination | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuestionsState = {
  items: [],
  pagination: null,
  loading: false,
  error: null,
};

export const fetchQuestionsById = createAsyncThunk(
  "questions/fetchByQuizSlug",
  async (
    { id, params }: { id: string; params?: QuestionsQueryParams },
    { rejectWithValue }
  ) => {
    const response = await AdminQuestionService.getQuestionsById(
      id,
      params
    );
    if (!response.success) {
      return rejectWithValue(response.message || "Failed to fetch questions");
    }
    return response;
  }
);

const adminQuestionSlice = createSlice({
  name: "adminQuestion",
  initialState,
  reducers: {
    clearQuestions: (state) => {
      state.items = [];
      state.pagination = null;
      state.error = null;
    },
    clearQuestionsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuestionsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuestionsById.fulfilled, (state, action) => {
        const payload = action.payload as QuestionsResponse;
        state.items = payload.data.items;
        state.pagination = payload.data.pagination;
        state.loading = false;
      })
      .addCase(fetchQuestionsById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch questions";
      });
  },
});

export const { clearQuestions, clearQuestionsError } =
  adminQuestionSlice.actions;
export default adminQuestionSlice.reducer;

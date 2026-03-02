import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  UserQuestionService,
  type QuestionItem,
  type QuestionsPagination,
  type QuestionsResponse,
  type QuestionsQueryParams,
} from "../services/user.question.service";
import { createQuestionSchema, updateQuestionSchema } from "../schema/question";

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
  "userQuestion/fetchByQuizSlug",
  async (
    { id, params }: { id: string; params?: QuestionsQueryParams },
    { rejectWithValue }
  ) => {
    const response = await UserQuestionService.getQuestionsById(id, params);
    if (!response.success) {
      return rejectWithValue(response.message || "Failed to fetch questions");
    }
    return response;
  }
);

export const createQuestion = createAsyncThunk(
  "userQuestion/create",
  async (payload: unknown, { rejectWithValue }) => {
    const parsed = createQuestionSchema.safeParse(payload);
    if (!parsed.success) {
      return rejectWithValue(parsed.error.flatten().formErrors.join("; "));
    }
    const response = await UserQuestionService.createQuestion(parsed.data);
    if (!response?.success) {
      return rejectWithValue(response?.message || "Failed to create question");
    }
    return response;
  }
);

export const updateQuestion = createAsyncThunk(
  "userQuestion/update",
  async ({ id, data }: { id: string; data: unknown }, { rejectWithValue }) => {
    const parsed = updateQuestionSchema.safeParse({ ...(data as object), id });
    if (!parsed.success) {
      return rejectWithValue(parsed.error.flatten().formErrors.join("; "));
    }
    const response = await UserQuestionService.updateQuestion(id, parsed.data);
    if (!response?.success) {
      return rejectWithValue(response?.message || "Failed to update question");
    }
    return response;
  }
);

export const deleteQuestion = createAsyncThunk(
  "userQuestion/delete",
  async (id: string, { rejectWithValue }) => {
    const response = await UserQuestionService.deleteQuestion(id);
    if (!response?.success) {
      return rejectWithValue(response?.message || "Failed to delete question");
    }
    return { id, response };
  }
);

const userQuestionSlice = createSlice({
  name: "userQuestion",
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
      })
      .addCase(createQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuestion.fulfilled, (state, action) => {
        const payload = action.payload as { data?: { item?: QuestionItem } };
        const newItem = payload?.data?.item as QuestionItem | undefined;
        if (newItem) state.items = [newItem, ...state.items];
        state.loading = false;
      })
      .addCase(createQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create question";
      })
      .addCase(updateQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuestion.fulfilled, (state, action) => {
        const payload = action.payload as { data?: { item?: QuestionItem } };
        const updated = payload?.data?.item as QuestionItem | undefined;
        if (updated) {
          state.items = state.items.map((q) =>
            q.id === updated.id ? updated : q
          );
        }
        state.loading = false;
      })
      .addCase(updateQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update question";
      })
      .addCase(deleteQuestion.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuestion.fulfilled, (state, action) => {
        const { id } = action.payload as { id: string };
        state.items = state.items.filter((q) => q.id !== id);
        state.loading = false;
      })
      .addCase(deleteQuestion.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete question";
      });
  },
});

export const { clearQuestions, clearQuestionsError } =
  userQuestionSlice.actions;
export default userQuestionSlice.reducer;

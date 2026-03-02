import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { QuizService } from "../services/user.quiz.service";
import {
  type Quiz,
  type PaginationInfo,
  type QuizQueryParams,
  type CreateQuizPayload,
  type UpdateQuizPayload,
} from "../types";
import type { QuizResponse, DeleteResponse } from "../types";

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuizState = {
  quizzes: [],
  currentQuiz: null,
  pagination: null,
  loading: false,
  error: null,
};

export const fetchQuizzes = createAsyncThunk(
  "quiz/fetchQuizzes",
  async (params?: QuizQueryParams, { rejectWithValue }) => {
    const response = await QuizService.getQuizzes(params);
    if (!response.success) {
      return rejectWithValue(response.message || "Failed to fetch quizzes");
    }
    return response;
  }
);

export const fetchQuizBySlug = createAsyncThunk(
  "quiz/fetchQuizBySlug",
  async (slug: string, { rejectWithValue }) => {
    const response = await QuizService.getQuizBySlug(slug);
    if (response.error) {
      return rejectWithValue(response.error.message || "Failed to fetch quiz");
    }
    return response.data || response;
  }
);

export const createQuiz = createAsyncThunk(
  "quiz/createQuiz",
  async (payload: CreateQuizPayload, { rejectWithValue }) => {
    const response = await QuizService.createQuiz(payload);
    if ("error" in (response as QuizResponse) && response.error) {
      // Preserve full error object (may include validation details)
      return rejectWithValue((response as QuizResponse).error);
    }
    return (response as QuizResponse<Quiz>).data as Quiz;
  }
);

export const updateQuiz = createAsyncThunk(
  "quiz/updateQuiz",
  async (
    { id, data }: { id: string; data: UpdateQuizPayload },
    { rejectWithValue }
  ) => {
    const response = await QuizService.updateQuizById(id, data);
    if ("error" in (response as QuizResponse) && response.error) {
      return rejectWithValue(response.error.message || "Failed to update quiz");
    }
    return (response as QuizResponse<Quiz>).data as Quiz;
  }
);

export const deleteQuiz = createAsyncThunk(
  "quiz/deleteQuiz",
  async (id: string, { rejectWithValue }) => {
    const response = await QuizService.deleteQuizById(id);
    if ((response as DeleteResponse).success === true) {
      return id;
    }
    if ((response as QuizResponse).error) {
      return rejectWithValue(
        (response as QuizResponse).error?.message || "Failed to delete quiz"
      );
    }
    return rejectWithValue("Failed to delete quiz");
  }
);

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentQuiz: (state) => {
      state.currentQuiz = null;
    },
    clearQuizzes: (state) => {
      state.quizzes = [];
      state.currentQuiz = null;
      state.pagination = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchQuizzes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizzes.fulfilled, (state, action) => {
        state.quizzes = action.payload.data.items;
        state.pagination = action.payload.data.pagination;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchQuizzes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchQuizBySlug.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizBySlug.fulfilled, (state, action) => {
        state.currentQuiz = action.payload as Quiz;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchQuizBySlug.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createQuiz.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createQuiz.fulfilled, (state, action) => {
        state.loading = false;
        state.quizzes = [action.payload as Quiz, ...state.quizzes];
      })
      .addCase(createQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateQuiz.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateQuiz.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload as Quiz;
        state.quizzes = state.quizzes.map((q) =>
          q.id === updated.id ? updated : q
        );
        if (state.currentQuiz && state.currentQuiz.id === updated.id) {
          state.currentQuiz = updated;
        }
      })
      .addCase(updateQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteQuiz.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteQuiz.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload as string;
        state.quizzes = state.quizzes.filter((q) => q.id !== id);
        if (state.currentQuiz && state.currentQuiz.id === id) {
          state.currentQuiz = null;
        }
      })
      .addCase(deleteQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentQuiz, clearQuizzes } = quizSlice.actions;

export default quizSlice.reducer;

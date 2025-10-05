import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { QuizService, type Quiz } from "../services/admin.quiz.service";

interface QuizState {
  quizzes: Quiz[];
  currentQuiz: Quiz | null;
  loading: boolean;
  error: string | null;
}

const initialState: QuizState = {
  quizzes: [],
  currentQuiz: null,
  loading: false,
  error: null,
};

export const fetchQuizzes = createAsyncThunk(
  "quiz/fetchQuizzes",
  async (_, { rejectWithValue }) => {
    const response = await QuizService.getQuizzes();
    if (response.error) {
      return rejectWithValue(
        response.error.message || "Failed to fetch quizzes"
      );
    }
    return response.data || response;
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
        state.quizzes = action.payload as Quiz[];
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
      });
  },
});

export const { clearError, clearCurrentQuiz, clearQuizzes } = quizSlice.actions;

export default quizSlice.reducer;

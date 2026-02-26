import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { ClientQuizService } from "../services/client.quiz.service";
import {
  type QuizState,
  type QuizQueryParams,
  type QuizCardProps,
  type PaginationInfo,
} from "../types/quiz.types";

const initialState: QuizState = {
  recentlyPublished: {
    quizzes: [],
    pagination: null,
    loading: false,
    error: null,
  },
  bestRated: {
    quizzes: [],
    pagination: null,
    loading: false,
    error: null,
  },
  popular: {
    quizzes: [],
    pagination: null,
    loading: false,
    error: null,
  },
  easy: {
    quizzes: [],
    pagination: null,
    loading: false,
    error: null,
  },
  hard: {
    quizzes: [],
    pagination: null,
    loading: false,
    error: null,
  },
  difficulty: {
    quizzes: [],
    pagination: null,
    loading: false,
    error: null,
    currentDifficulty: null,
  },
};

// Async thunks
export const fetchRecentlyPublishedQuizzes = createAsyncThunk(
  "clientQuiz/fetchRecentlyPublishedQuizzes",
  async (params?: QuizQueryParams, { rejectWithValue }) => {
    const response = await ClientQuizService.getRecentlyPublishedQuizzes(
      params
    );
    if (!response.success) {
      return rejectWithValue(
        response.message || "Failed to fetch recently published quizzes"
      );
    }
    return response;
  }
);

export const fetchBestRatedQuizzes = createAsyncThunk(
  "clientQuiz/fetchBestRatedQuizzes",
  async (params?: QuizQueryParams, { rejectWithValue }) => {
    const response = await ClientQuizService.getBestRatedQuizzes(params);
    if (!response.success) {
      return rejectWithValue(
        response.message || "Failed to fetch best rated quizzes"
      );
    }
    return response;
  }
);

export const fetchPopularQuizzes = createAsyncThunk(
  "clientQuiz/fetchPopularQuizzes",
  async (params?: QuizQueryParams, { rejectWithValue }) => {
    const response = await ClientQuizService.getPopularQuizzes(params);
    if (!response.success) {
      return rejectWithValue(
        response.message || "Failed to fetch popular quizzes"
      );
    }
    return response;
  }
);

export const fetchEasyQuizzes = createAsyncThunk(
  "clientQuiz/fetchEasyQuizzes",
  async (params?: QuizQueryParams, { rejectWithValue }) => {
    const response = await ClientQuizService.getEasyQuizzes(params);
    if (!response.success) {
      return rejectWithValue(
        response.message || "Failed to fetch easy quizzes"
      );
    }
    return response;
  }
);

export const fetchHardQuizzes = createAsyncThunk(
  "clientQuiz/fetchHardQuizzes",
  async (params?: QuizQueryParams, { rejectWithValue }) => {
    const response = await ClientQuizService.getHardQuizzes(params);
    if (!response.success) {
      return rejectWithValue(
        response.message || "Failed to fetch hard quizzes"
      );
    }
    return response;
  }
);

export const fetchQuizzesByDifficulty = createAsyncThunk(
  "clientQuiz/fetchQuizzesByDifficulty",
  async (
    { difficulty, params }: { difficulty: string; params?: QuizQueryParams },
    { rejectWithValue }
  ) => {
    const response = await ClientQuizService.getQuizzesByDifficulty(
      difficulty,
      params
    );
    if (!response.success) {
      return rejectWithValue(
        response.message || `Failed to fetch ${difficulty} quizzes`
      );
    }
    return { response, difficulty };
  }
);

const clientQuizSlice = createSlice({
  name: "clientQuiz",
  initialState,
  reducers: {
    clearError: (state, action: PayloadAction<keyof QuizState>) => {
      state[action.payload].error = null;
    },
    clearAllErrors: (state) => {
      Object.keys(state).forEach((key) => {
        const category = key as keyof QuizState;
        if (state[category] && "error" in state[category]) {
          (state[category] as any).error = null;
        }
      });
    },
    clearQuizzes: (state, action: PayloadAction<keyof QuizState>) => {
      const category = state[action.payload];
      if (category && "quizzes" in category) {
        (category as any).quizzes = [];
        (category as any).pagination = null;
        (category as any).loading = false;
        (category as any).error = null;
      }
    },
    clearAllQuizzes: (state) => {
      Object.keys(state).forEach((key) => {
        const category = key as keyof QuizState;
        if (state[category] && "quizzes" in state[category]) {
          (state[category] as any).quizzes = [];
          (state[category] as any).pagination = null;
          (state[category] as any).loading = false;
          (state[category] as any).error = null;
        }
      });
    },
  },
  extraReducers: (builder) => {
    // Recently Published Quizzes
    builder
      .addCase(fetchRecentlyPublishedQuizzes.pending, (state) => {
        state.recentlyPublished.loading = true;
        state.recentlyPublished.error = null;
      })
      .addCase(fetchRecentlyPublishedQuizzes.fulfilled, (state, action) => {
        state.recentlyPublished.loading = false;
        state.recentlyPublished.quizzes = action.payload.data?.items || [];
        state.recentlyPublished.pagination = action.payload.data?.pagination || null;
        state.recentlyPublished.error = null;
      })
      .addCase(fetchRecentlyPublishedQuizzes.rejected, (state, action) => {
        state.recentlyPublished.loading = false;
        state.recentlyPublished.error = action.payload as string;
      });

    // Best Rated Quizzes
    builder
      .addCase(fetchBestRatedQuizzes.pending, (state) => {
        state.bestRated.loading = true;
        state.bestRated.error = null;
      })
      .addCase(fetchBestRatedQuizzes.fulfilled, (state, action) => {
        state.bestRated.loading = false;
        state.bestRated.quizzes = action.payload.data?.items || [];
        state.bestRated.pagination = action.payload.data?.pagination || null;
        state.bestRated.error = null;
      })
      .addCase(fetchBestRatedQuizzes.rejected, (state, action) => {
        state.bestRated.loading = false;
        state.bestRated.error = action.payload as string;
      });

    // Popular Quizzes
    builder
      .addCase(fetchPopularQuizzes.pending, (state) => {
        state.popular.loading = true;
        state.popular.error = null;
      })
      .addCase(fetchPopularQuizzes.fulfilled, (state, action) => {
        state.popular.loading = false;
        state.popular.quizzes = action.payload.data?.items || [];
        state.popular.pagination = action.payload.data?.pagination || null;
        state.popular.error = null;
      })
      .addCase(fetchPopularQuizzes.rejected, (state, action) => {
        state.popular.loading = false;
        state.popular.error = action.payload as string;
      });

    // Easy Quizzes
    builder
      .addCase(fetchEasyQuizzes.pending, (state) => {
        state.easy.loading = true;
        state.easy.error = null;
      })
      .addCase(fetchEasyQuizzes.fulfilled, (state, action) => {
        state.easy.loading = false;
        state.easy.quizzes = action.payload.data?.items || [];
        state.easy.pagination = action.payload.data?.pagination || null;
        state.easy.error = null;
      })
      .addCase(fetchEasyQuizzes.rejected, (state, action) => {
        state.easy.loading = false;
        state.easy.error = action.payload as string;
      });

    // Hard Quizzes
    builder
      .addCase(fetchHardQuizzes.pending, (state) => {
        state.hard.loading = true;
        state.hard.error = null;
      })
      .addCase(fetchHardQuizzes.fulfilled, (state, action) => {
        state.hard.loading = false;
        state.hard.quizzes = action.payload.data?.items || [];
        state.hard.pagination = action.payload.data?.pagination || null;
        state.hard.error = null;
      })
      .addCase(fetchHardQuizzes.rejected, (state, action) => {
        state.hard.loading = false;
        state.hard.error = action.payload as string;
      });

    // Quizzes by Difficulty
    builder
      .addCase(fetchQuizzesByDifficulty.pending, (state) => {
        state.difficulty.loading = true;
        state.difficulty.error = null;
      })
      .addCase(fetchQuizzesByDifficulty.fulfilled, (state, action) => {
        state.difficulty.loading = false;
        state.difficulty.quizzes = action.payload.response.data?.items || [];
        state.difficulty.pagination = action.payload.response.data?.pagination || null;
        state.difficulty.currentDifficulty = action.payload.difficulty;
        state.difficulty.error = null;
      })
      .addCase(fetchQuizzesByDifficulty.rejected, (state, action) => {
        state.difficulty.loading = false;
        state.difficulty.error = action.payload as string;
      });
  },
});

export const { clearError, clearAllErrors, clearQuizzes, clearAllQuizzes } =
  clientQuizSlice.actions;

export default clientQuizSlice.reducer;

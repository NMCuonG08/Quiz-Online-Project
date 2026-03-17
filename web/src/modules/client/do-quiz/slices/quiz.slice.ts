import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { QuizService } from "../services/quiz.service";
import {
  Question,
  QuizSession,
  UserAnswer,
  QuizResult,
  QuizProgress,
} from "../types/quiz.types";

interface QuizState {
  // Quiz data
  questions: Question[];
  currentQuestionIndex: number;
  session: QuizSession | null;
  result: QuizResult | null;

  // UI state
  loading: boolean;
  error: string | null;
  isQuizStarted: boolean;
  isQuizCompleted: boolean;
  isSubmitting: boolean;

  // Progress tracking
  progress: QuizProgress;
  userAnswers: UserAnswer[];

  // Timer state
  timeRemaining: number;
  timerActive: boolean;
}

const initialState: QuizState = {
  questions: [],
  currentQuestionIndex: 0,
  session: null,
  result: null,
  loading: false,
  error: null,
  isQuizStarted: false,
  isQuizCompleted: false,
  isSubmitting: false,
  progress: {
    current_question: 0,
    total_questions: 0,
    percentage: 0,
    time_remaining: 0,
    score: 0,
  },
  userAnswers: [],
  timeRemaining: 0,
  timerActive: false,
};

// Async thunks
export const fetchQuizQuestions = createAsyncThunk(
  "quiz/fetchQuestions",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await QuizService.getQuizQuestions(slug);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || "Failed to fetch questions");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error occurred";
      return rejectWithValue(errorMessage);
    }
  }
);

export const startQuizSession = createAsyncThunk(
  "quiz/startSession",
  async (slug: string, { rejectWithValue }) => {
    try {
      const response = await QuizService.startQuizSession(slug);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(
        response.message || "Failed to start quiz session"
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error occurred";
      return rejectWithValue(errorMessage);
    }
  }
);

export const submitAnswer = createAsyncThunk(
  "quiz/submitAnswer",
  async (
    {
      sessionId,
      questionId,
      answer,
    }: { sessionId: string; questionId: string; answer: UserAnswer },
    { rejectWithValue }
  ) => {
    try {
      const response = await QuizService.submitAnswer(
        sessionId,
        questionId,
        answer
      );
      if (response.success) {
        return { questionId, answer };
      }
      return rejectWithValue(response.message || "Failed to submit answer");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error occurred";
      return rejectWithValue(errorMessage);
    }
  }
);

export const completeQuiz = createAsyncThunk(
  "quiz/completeQuiz",
  async (sessionId: string, { rejectWithValue }) => {
    try {
      const response = await QuizService.completeQuiz(sessionId);
      if (response.success && response.data) {
        return response.data;
      }
      return rejectWithValue(response.message || "Failed to complete quiz");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Network error occurred";
      return rejectWithValue(errorMessage);
    }
  }
);

const quizSlice = createSlice({
  name: "quiz",
  initialState,
  reducers: {
    setCurrentQuestion: (state, action: PayloadAction<number>) => {
      state.currentQuestionIndex = action.payload;
      state.progress.current_question = action.payload + 1;
      state.progress.percentage = Math.round(
        ((action.payload + 1) / state.questions.length) * 100
      );
    },

    setUserAnswer: (state, action: PayloadAction<UserAnswer>) => {
      console.log("REDUX setUserAnswer:", {
        questionId: action.payload.question_id,
        selectedOptionId: action.payload.selected_option_id,
        currentAnswersCount: state.userAnswers.length,
      });
      
      const existingAnswerIndex = state.userAnswers.findIndex(
        (answer) => answer.question_id === action.payload.question_id
      );

      if (existingAnswerIndex >= 0) {
        state.userAnswers[existingAnswerIndex] = action.payload;
        console.log("REDUX: Updated existing answer at index", existingAnswerIndex);
      } else {
        state.userAnswers.push(action.payload);
        console.log("REDUX: Pushed new answer, new count:", state.userAnswers.length);
      }
    },

    // Set all user answers at once (for loading from localStorage)
    setUserAnswers: (state, action: PayloadAction<UserAnswer[]>) => {
      state.userAnswers = action.payload;
    },

    setTimeRemaining: (state, action: PayloadAction<number>) => {
      state.timeRemaining = action.payload;
      state.progress.time_remaining = action.payload;
    },

    setTimerActive: (state, action: PayloadAction<boolean>) => {
      state.timerActive = action.payload;
    },

    nextQuestion: (state) => {
      if (state.currentQuestionIndex < state.questions.length - 1) {
        state.currentQuestionIndex += 1;
        state.progress.current_question = state.currentQuestionIndex + 1;
        state.progress.percentage = Math.round(
          ((state.currentQuestionIndex + 1) / state.questions.length) * 100
        );
      }
    },

    previousQuestion: (state) => {
      if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex -= 1;
        state.progress.current_question = state.currentQuestionIndex + 1;
        state.progress.percentage = Math.round(
          ((state.currentQuestionIndex + 1) / state.questions.length) * 100
        );
      }
    },

    resetQuiz: (state) => {
      return { ...initialState };
    },

    resetSession: (state) => {
      state.session = null;
      state.result = null;
      state.isQuizStarted = false;
      state.isQuizCompleted = false;
      state.userAnswers = [];
      state.currentQuestionIndex = 0;
      state.progress = { ...initialState.progress };
      state.timeRemaining = 0;
      state.timerActive = false;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch questions
    builder
      .addCase(fetchQuizQuestions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchQuizQuestions.fulfilled, (state, action) => {
        state.loading = false;
        state.questions = action.payload;
        state.progress.total_questions = action.payload.length;
        state.progress.percentage = 0;
      })
      .addCase(fetchQuizQuestions.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to fetch questions";
      });

    // Start session
    builder
      .addCase(startQuizSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startQuizSession.fulfilled, (state, action) => {
        state.loading = false;
        state.session = action.payload;
        
        // If resuming, populate existing answers
        if (action.payload.answers && action.payload.answers.length > 0) {
          state.userAnswers = action.payload.answers.map((a: any) => ({
             question_id: a.question_id,
             selected_option_id: a.selected_option_id,
             text_answer: a.text_answer,
             answered_at: new Date().toISOString(), // Fallback time
             is_correct: false, // Default, not shown explicitly during quiz
             points_earned: 0, // Default
             time_spent: 0 // Default
          }));
          
          // Set current question to the next unanswered one
          // Find first question that doesn't have an answer
          const firstUnansweredIndex = state.questions.findIndex(
            q => !state.userAnswers.some(a => a.question_id === q.id)
          );
          
          // If found, go to that index. If all answered, go to last one.
          state.currentQuestionIndex = firstUnansweredIndex !== -1 
            ? firstUnansweredIndex 
            : Math.min(state.userAnswers.length, state.questions.length - 1);
            
        } else {
          // New session
          state.userAnswers = [];
          state.currentQuestionIndex = 0;
        }

        state.isQuizStarted = true;
        
        // Update progress based on current index
        const currentQ = state.currentQuestionIndex + 1;
        state.progress.current_question = currentQ;
        state.progress.percentage = Math.round(
          (currentQ / (state.questions.length || 1)) * 100
        );
      })
      .addCase(startQuizSession.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to start quiz session";
      });

    // Submit answer
    builder
      .addCase(submitAnswer.pending, (state) => {
        state.isSubmitting = true;
      })
      .addCase(submitAnswer.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const { questionId, answer } = action.payload;

        const existingAnswerIndex = state.userAnswers.findIndex(
          (userAnswer) => userAnswer.question_id === questionId
        );

        if (existingAnswerIndex >= 0) {
          state.userAnswers[existingAnswerIndex] = answer;
        } else {
          state.userAnswers.push(answer);
        }

        state.progress.score += answer.points_earned;
      })
      .addCase(submitAnswer.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to submit answer";
      });

    // Complete quiz
    builder
      .addCase(completeQuiz.pending, (state) => {
        state.loading = true;
      })
      .addCase(completeQuiz.fulfilled, (state, action) => {
        state.loading = false;
        state.result = action.payload;
        state.isQuizCompleted = true;
        state.timerActive = false;
      })
      .addCase(completeQuiz.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === "string"
            ? action.payload
            : "Failed to complete quiz";
      });
  },
});

export const {
  setCurrentQuestion,
  setUserAnswer,
  setUserAnswers,
  setTimeRemaining,
  setTimerActive,
  nextQuestion,
  previousQuestion,
  resetQuiz,
  resetSession,
  clearError,
} = quizSlice.actions;

export default quizSlice.reducer;

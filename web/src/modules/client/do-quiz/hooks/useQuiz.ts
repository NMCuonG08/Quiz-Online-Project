"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import {
  fetchQuizQuestions,
  startQuizSession,
  submitAnswer,
  completeQuiz,
  setTimeRemaining,
  setTimerActive,
  nextQuestion,
  previousQuestion,
  resetQuiz,
  clearError,
  setCurrentQuestion,
  setUserAnswer,
  setUserAnswers,
} from "../slices/quiz.slice";
import { UserAnswer } from "../types/quiz.types";

// LocalStorage keys
const getStorageKey = (slug: string) => `quiz_answers_${slug}`;
const getProgressKey = (slug: string) => `quiz_progress_${slug}`;

// Helper to safely access localStorage (SSR-safe)
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  },
};

export const useQuiz = (slug: string) => {
  const dispatch = useAppDispatch();
  const {
    questions,
    currentQuestionIndex,
    session,
    result,
    loading,
    error,
    isQuizStarted,
    isQuizCompleted,
    isSubmitting,
    progress,
    userAnswers,
    timeRemaining,
    timerActive,
  } = useAppSelector((state) => state.quiz);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handleSubmitAnswerRef = useRef<typeof handleSubmitAnswer | null>(null);
  const hasLoadedFromStorage = useRef(false);

  // Initialize quiz
  useEffect(() => {
    if (slug) {
      dispatch(fetchQuizQuestions(slug));
    }
    return () => {
      dispatch(resetQuiz());
    };
  }, [dispatch, slug]);

  // Load saved answers from localStorage when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !hasLoadedFromStorage.current && slug) {
      hasLoadedFromStorage.current = true;
      
      const key = getStorageKey(slug);
      console.log("📂 Trying to load from localStorage:", { key, questionsCount: questions.length });
      
      // Load saved answers
      const savedAnswersJson = safeLocalStorage.getItem(key);
      console.log("📂 localStorage data:", savedAnswersJson ? `Found ${savedAnswersJson.length} chars` : "NOT FOUND");
      
      if (savedAnswersJson) {
        try {
          const savedAnswers = JSON.parse(savedAnswersJson) as UserAnswer[];
          if (Array.isArray(savedAnswers) && savedAnswers.length > 0) {
            dispatch(setUserAnswers(savedAnswers));
            console.log("📂 LOADED saved answers from localStorage:", savedAnswers.length, savedAnswers);
          }
        } catch (e) {
          console.error("Failed to parse saved answers:", e);
        }
      }
      
      // Load saved progress (current question index)
      const savedProgressJson = safeLocalStorage.getItem(getProgressKey(slug));
      if (savedProgressJson) {
        try {
          const savedProgress = JSON.parse(savedProgressJson);
          if (typeof savedProgress.currentIndex === "number" && savedProgress.currentIndex >= 0) {
            dispatch(setCurrentQuestion(Math.min(savedProgress.currentIndex, questions.length - 1)));
            console.log("Loaded saved progress from localStorage:", savedProgress.currentIndex);
          }
        } catch (e) {
          console.error("Failed to parse saved progress:", e);
        }
      }
    }
  }, [questions, slug, dispatch]);

  // Save answers to localStorage whenever they change
  useEffect(() => {
    if (slug && userAnswers.length > 0 && isQuizStarted) {
      const key = getStorageKey(slug);
      const data = JSON.stringify(userAnswers);
      safeLocalStorage.setItem(key, data);
      console.log("💾 SAVED to localStorage:", { key, answersCount: userAnswers.length, isQuizStarted });
    }
  }, [userAnswers, slug, isQuizStarted]);

  // Save current question index to localStorage
  useEffect(() => {
    if (slug && isQuizStarted && questions.length > 0) {
      safeLocalStorage.setItem(
        getProgressKey(slug),
        JSON.stringify({ currentIndex: currentQuestionIndex, timestamp: Date.now() })
      );
    }
  }, [currentQuestionIndex, slug, isQuizStarted, questions.length]);

  // Clear localStorage when quiz is completed
  useEffect(() => {
    if (isQuizCompleted && slug) {
      safeLocalStorage.removeItem(getStorageKey(slug));
      safeLocalStorage.removeItem(getProgressKey(slug));
      console.log("Cleared saved quiz data from localStorage");
    }
  }, [isQuizCompleted, slug]);

  // Save answer locally (no API call)
  // Now accepts complete UserAnswer (with question_id already set)
  const saveAnswer = useCallback(
    (answer: UserAnswer) => {
      console.log("saveAnswer dispatching:", {
        questionId: answer.question_id,
        selectedOptionId: answer.selected_option_id,
        textAnswer: answer.text_answer,
      });
      
      dispatch(setUserAnswer(answer));
    },
    [dispatch]
  );

  // Submit current answer to API
  const submitCurrentAnswer = useCallback(
    async () => {
      if (!session) return;
      
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) return;
      
      const existingAnswer = userAnswers.find(
        (a) => a.question_id === currentQuestion.id
      );
      
      // Only submit if there's an actual answer (not empty)
      const hasActualAnswer = existingAnswer && (
        existingAnswer.selected_option_id !== undefined ||
        (existingAnswer.text_answer !== undefined && existingAnswer.text_answer.trim() !== '')
      );
      
      if (!hasActualAnswer) return; // No actual answer to submit
      
      try {
        await dispatch(
          submitAnswer({
            sessionId: session.id,
            questionId: currentQuestion.id,
            answer: existingAnswer,
          })
        ).unwrap();
      } catch (error) {
        // Ignore 409 Conflict (already submitted)
        console.log("Answer submission:", error);
      }
    },
    [dispatch, session, questions, currentQuestionIndex, userAnswers]
  );

  // Keep for backward compatibility
  const handleSubmitAnswer = saveAnswer;

  // Update ref whenever handleSubmitAnswer changes
  useEffect(() => {
    handleSubmitAnswerRef.current = handleSubmitAnswer;
  }, [handleSubmitAnswer]);

  const startQuiz = useCallback(async () => {
    try {
      await dispatch(startQuizSession(slug)).unwrap();
      dispatch(setTimerActive(true));
    } catch (error) {
      console.error("Failed to start quiz:", error);
      // Don't rethrow the error
    }
  }, [dispatch, slug]);

  // Timer effect
  // Track if timer was ever initialized (to prevent auto-submit on initial load)
  const timerInitializedRef = useRef(false);
  
  useEffect(() => {
    // Only run timer logic if timeRemaining > 0 (timer was set)
    if (timerActive && timeRemaining > 0) {
      timerInitializedRef.current = true;  // Timer has been initialized
      timerRef.current = setInterval(() => {
        dispatch(setTimeRemaining(timeRemaining - 1));
      }, 1000);
    } else if (timeRemaining === 0 && timerActive && timerInitializedRef.current) {
      // Time's up - auto submit current question
      // ONLY if timer was actually initialized (countdown from > 0 to 0)
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion && session && handleSubmitAnswerRef.current) {
        // Create complete UserAnswer with question_id
        const emptyAnswer: UserAnswer = {
          question_id: currentQuestion.id,
          selected_option_id: undefined,
          text_answer: "",
          is_correct: false,
          points_earned: 0,
          time_spent: currentQuestion.time_limit || 0,
          answered_at: new Date().toISOString(),
        };
        handleSubmitAnswerRef.current(emptyAnswer);
      }
    }
    // Note: If timeRemaining === 0 && !timerInitializedRef.current, do nothing (initial state)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [
    timerActive,
    timeRemaining,
    dispatch,
    questions,
    currentQuestionIndex,
    session,
  ]);

  const handleCompleteQuiz = useCallback(async () => {
    if (!session) return;

    try {
      // Submit current answer before completing
      await submitCurrentAnswer();
      
      dispatch(setTimerActive(false));
      await dispatch(completeQuiz(session.id)).unwrap();
      
      // Clear localStorage after successful completion
      if (slug) {
        safeLocalStorage.removeItem(getStorageKey(slug));
        safeLocalStorage.removeItem(getProgressKey(slug));
      }
    } catch (error) {
      console.error("Failed to complete quiz:", error);
      // Don't rethrow the error
    }
  }, [dispatch, session, submitCurrentAnswer, slug]);

  const handleNextQuestion = useCallback(async () => {
    // Submit current answer before moving to next
    await submitCurrentAnswer();
    
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(nextQuestion());
    } else {
      // Last question - complete quiz
      handleCompleteQuiz();
    }
  }, [dispatch, currentQuestionIndex, questions.length, handleCompleteQuiz, submitCurrentAnswer]);

  const handlePreviousQuestion = useCallback(() => {
    dispatch(previousQuestion());
  }, [dispatch]);

  const goToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) {
        dispatch(setCurrentQuestion(index));
      }
    },
    [dispatch, questions.length]
  );

  const getCurrentQuestion = useCallback(() => {
    return questions[currentQuestionIndex];
  }, [questions, currentQuestionIndex]);

  const getUserAnswer = useCallback(
    (questionId: string) => {
      return userAnswers.find((answer) => answer.question_id === questionId);
    },
    [userAnswers]
  );

  const clearQuizError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const resetQuizState = useCallback(() => {
    // Clear localStorage when resetting
    if (slug) {
      safeLocalStorage.removeItem(getStorageKey(slug));
      safeLocalStorage.removeItem(getProgressKey(slug));
    }
    hasLoadedFromStorage.current = false;
    dispatch(resetQuiz());
  }, [dispatch, slug]);

  return {
    // State
    questions,
    currentQuestionIndex,
    session,
    result,
    loading,
    error,
    isQuizStarted,
    isQuizCompleted,
    isSubmitting,
    progress,
    userAnswers,
    timeRemaining,
    timerActive,

    // Actions
    startQuiz,
    saveAnswer,
    handleSubmitAnswer,
    submitCurrentAnswer,
    handleNextQuestion,
    handlePreviousQuestion,
    handleCompleteQuiz,
    goToQuestion,
    getCurrentQuestion,
    getUserAnswer,
    clearQuizError,
    resetQuizState,
  };
};

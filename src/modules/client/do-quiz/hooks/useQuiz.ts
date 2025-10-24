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
} from "../slices/quiz.slice";
import { UserAnswer } from "../types/quiz.types";

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

  // Initialize quiz
  useEffect(() => {
    if (slug) {
      dispatch(fetchQuizQuestions(slug));
    }
    return () => {
      dispatch(resetQuiz());
    };
  }, [dispatch, slug]);

  const handleSubmitAnswer = useCallback(
    async (answer: Omit<UserAnswer, "question_id" | "answered_at">) => {
      if (!session) return;

      const userAnswer: UserAnswer = {
        ...answer,
        question_id: questions[currentQuestionIndex].id,
        answered_at: new Date().toISOString(),
      };

      try {
        await dispatch(
          submitAnswer({
            sessionId: session.id,
            questionId: questions[currentQuestionIndex].id,
            answer: userAnswer,
          })
        ).unwrap();
      } catch (error) {
        console.error("Failed to submit answer:", error);
        // Don't throw the error, just log it
      }
    },
    [dispatch, session, questions, currentQuestionIndex]
  );

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
  useEffect(() => {
    if (timerActive && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        dispatch(setTimeRemaining(timeRemaining - 1));
      }, 1000);
    } else if (timeRemaining === 0 && timerActive) {
      // Time's up - auto submit current question
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion && session && handleSubmitAnswerRef.current) {
        handleSubmitAnswerRef.current({
          selected_option_id: undefined,
          text_answer: "",
          is_correct: false,
          points_earned: 0,
          time_spent: currentQuestion.time_limit || 0,
        });
      }
    }

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
      dispatch(setTimerActive(false));
      await dispatch(completeQuiz(session.id)).unwrap();
    } catch (error) {
      console.error("Failed to complete quiz:", error);
      // Don't rethrow the error
    }
  }, [dispatch, session]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      dispatch(nextQuestion());
    } else {
      // Last question - complete quiz
      handleCompleteQuiz();
    }
  }, [dispatch, currentQuestionIndex, questions.length, handleCompleteQuiz]);

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
    dispatch(resetQuiz());
  }, [dispatch]);

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
    handleSubmitAnswer,
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

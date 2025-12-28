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


  // Save answer locally (no API call)
  const saveAnswer = useCallback(
    (answer: Omit<UserAnswer, "question_id" | "answered_at">) => {
      const userAnswer: UserAnswer = {
        ...answer,
        question_id: questions[currentQuestionIndex].id,
        answered_at: new Date().toISOString(),
      };
      
      dispatch(setUserAnswer(userAnswer));
    },
    [dispatch, questions, currentQuestionIndex]
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
      // Submit current answer before completing
      await submitCurrentAnswer();
      
      dispatch(setTimerActive(false));
      await dispatch(completeQuiz(session.id)).unwrap();
    } catch (error) {
      console.error("Failed to complete quiz:", error);
      // Don't rethrow the error
    }
  }, [dispatch, session, submitCurrentAnswer]);

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

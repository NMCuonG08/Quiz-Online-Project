"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Question } from "../../do-quiz/types/quiz.types";
import { GameQuizState, GameQuizAnswer } from "../types/game-quiz.types";
import { QuestionRendererFactory } from "../factory/QuestionRendererFactory";

interface UseGameQuizProps {
  roomId: string;
  quizId: string;
  questions: Question[];
  onAnswerSubmit?: (answer: GameQuizAnswer) => void;
  onGameEnd?: (finalScore: number) => void;
}

export const useGameQuiz = ({
  roomId,
  quizId,
  questions,
  onAnswerSubmit,
  onGameEnd,
}: UseGameQuizProps) => {
  const [state, setState] = useState<GameQuizState>({
    roomId,
    quizId,
    currentQuestionIndex: 0,
    questions,
    selectedAnswers: new Map(),
    timeRemaining: 0,
    isAnswered: false,
    isGameStarted: false,
    isGameEnded: false,
    score: 0,
    totalScore: questions.reduce((sum, q) => sum + q.points, 0),
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize game
  const startGame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isGameStarted: true,
      currentQuestionIndex: 0,
    }));
    startTimerForCurrentQuestion();
  }, []);

  // Start timer for current question
  const startTimerForCurrentQuestion = useCallback(() => {
    const currentQuestion = questions[state.currentQuestionIndex];
    if (!currentQuestion?.time_limit) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setState((prev) => ({
      ...prev,
      timeRemaining: currentQuestion.time_limit || 0,
    }));

    timerRef.current = setInterval(() => {
      setState((prev) => {
        if (prev.timeRemaining <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          // Auto submit when time runs out
          handleAutoSubmit();
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
  }, [state.currentQuestionIndex, questions]);

  // Handle answer selection
  const selectAnswer = useCallback((answer: string | string[]) => {
    const currentQuestion = questions[state.currentQuestionIndex];
    if (!currentQuestion || state.isAnswered) return;

    setState((prev) => {
      const newSelectedAnswers = new Map(prev.selectedAnswers);
      newSelectedAnswers.set(currentQuestion.id, answer);
      return {
        ...prev,
        selectedAnswers: newSelectedAnswers,
      };
    });
  }, [state.currentQuestionIndex, state.isAnswered, questions]);

  // Submit answer
  const submitAnswer = useCallback(() => {
    const currentQuestion = questions[state.currentQuestionIndex];
    if (!currentQuestion || state.isAnswered) return;

    const selectedAnswer = state.selectedAnswers.get(currentQuestion.id);
    if (!selectedAnswer) return;

    // Validate answer
    const strategy = QuestionRendererFactory.getStrategyForQuestion(currentQuestion);
    const isCorrect = strategy.validateAnswer(currentQuestion, selectedAnswer);

    const answerData: GameQuizAnswer = {
      questionId: currentQuestion.id,
      selectedOptionId: typeof selectedAnswer === "string" ? selectedAnswer : undefined,
      selectedOptionIds: Array.isArray(selectedAnswer) ? selectedAnswer : undefined,
      textAnswer: typeof selectedAnswer === "string" && 
        (currentQuestion.question_type === "fill_blank" || 
         currentQuestion.question_type === "fill_in_blank" ||
         currentQuestion.question_type === "short_answer" ||
         currentQuestion.question_type === "essay" ||
         currentQuestion.question_type === "matching") 
        ? selectedAnswer : undefined,
      answeredAt: new Date(),
      timeSpent: (currentQuestion.time_limit || 0) - state.timeRemaining,
    };

    // Update score
    const pointsEarned = isCorrect ? currentQuestion.points : 0;
    setState((prev) => ({
      ...prev,
      isAnswered: true,
      score: prev.score + pointsEarned,
    }));

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Callback
    onAnswerSubmit?.(answerData);
  }, [state, questions, onAnswerSubmit]);

  // Auto submit when time runs out
  const handleAutoSubmit = useCallback(() => {
    const currentQuestion = questions[state.currentQuestionIndex];
    if (!currentQuestion || state.isAnswered) return;

    const selectedAnswer = state.selectedAnswers.get(currentQuestion.id);
    if (!selectedAnswer) {
      // Auto-select first option if no answer selected
      const defaultAnswer = QuestionRendererFactory
        .getStrategyForQuestion(currentQuestion)
        .getDefaultAnswer();
      if (defaultAnswer) {
        selectAnswer(defaultAnswer);
      }
    }

    setTimeout(() => {
      submitAnswer();
    }, 100);
  }, [state, questions, selectAnswer, submitAnswer]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    if (state.currentQuestionIndex >= questions.length - 1) {
      // Game ended
      setState((prev) => ({
        ...prev,
        isGameEnded: true,
      }));
      onGameEnd?.(state.score);
      return;
    }

    setState((prev) => ({
      ...prev,
      currentQuestionIndex: prev.currentQuestionIndex + 1,
      isAnswered: false,
    }));

    startTimerForCurrentQuestion();
  }, [state.currentQuestionIndex, state.score, questions.length, onGameEnd, startTimerForCurrentQuestion]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Update timer when question changes
  useEffect(() => {
    if (state.isGameStarted && !state.isAnswered) {
      startTimerForCurrentQuestion();
    }
  }, [state.currentQuestionIndex, state.isGameStarted, startTimerForCurrentQuestion]);

  const currentQuestion = questions[state.currentQuestionIndex];
  const selectedAnswer = currentQuestion
    ? state.selectedAnswers.get(currentQuestion.id)
    : undefined;

  return {
    // State
    currentQuestion,
    currentQuestionIndex: state.currentQuestionIndex,
    totalQuestions: questions.length,
    selectedAnswer,
    isAnswered: state.isAnswered,
    isGameStarted: state.isGameStarted,
    isGameEnded: state.isGameEnded,
    score: state.score,
    totalScore: state.totalScore,
    timeRemaining: state.timeRemaining,
    hasSelectedAnswer: !!selectedAnswer,
    isLastQuestion: state.currentQuestionIndex >= questions.length - 1,
    // Actions
    startGame,
    selectAnswer,
    submitAnswer,
    nextQuestion,
  };
};


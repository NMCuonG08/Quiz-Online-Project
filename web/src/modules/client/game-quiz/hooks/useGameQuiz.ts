"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Question } from "../../do-quiz/types/quiz.types";
import { GameQuizState, GameQuizAnswer } from "../types/game-quiz.types";

interface UseGameQuizProps {
  roomId: string;
  quizId: string;
  questions: Question[];
  onAnswerSubmit?: (answer: GameQuizAnswer) => void;
  onGameEnd?: (finalScore: number) => void;
}

interface AuthoritativeGameState {
  status: "WAITING" | "QUESTION" | "FINISHED";
  questionIndex: number;
  deadline?: number;
  answeredQuestionId?: string;
  playerScore?: number;
  playerCorrectAnswers?: number;
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
    correctAnswersCount: 0,
    totalScore: questions.reduce((sum, q) => sum + q.points, 0),
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const deadlineRef = useRef<number | null>(null);
  const endNotifiedRef = useRef(false);
  const scoredQuestionsRef = useRef(new Set<string>());

  const syncGameState = useCallback((snapshot: AuthoritativeGameState) => {
    deadlineRef.current = snapshot.deadline || null;
    if (timerRef.current) clearInterval(timerRef.current);
    setState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, Math.min(snapshot.questionIndex, Math.max(0, questions.length - 1))),
      isGameStarted: snapshot.status === "QUESTION",
      isGameEnded: snapshot.status === "FINISHED",
      isAnswered: snapshot.answeredQuestionId
        ? snapshot.answeredQuestionId === questions[snapshot.questionIndex]?.id
        : snapshot.questionIndex !== prev.currentQuestionIndex
          ? false
          : prev.isAnswered,
      score: snapshot.playerScore ?? prev.score,
      correctAnswersCount:
        snapshot.playerCorrectAnswers ?? prev.correctAnswersCount,
      timeRemaining: snapshot.deadline
        ? Math.max(0, Math.ceil((snapshot.deadline - Date.now()) / 1000))
        : 0,
    }));
  }, [questions]);

  const syncScore = useCallback((score: number, correctAnswers: number) => {
    setState((prev) => ({
      ...prev,
      score: Math.max(0, Number(score || 0)),
      correctAnswersCount: Math.max(0, Number(correctAnswers || 0)),
    }));
  }, []);

  // Start timer for current question
  const startTimerForCurrentQuestion = useCallback(() => {
    const currentQuestion = questions[state.currentQuestionIndex];
    if (!currentQuestion?.time_limit) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const deadline = deadlineRef.current || Date.now() + (currentQuestion.time_limit || 0) * 1000;
    deadlineRef.current = deadline;
    setState((prev) => ({
      ...prev,
      timeRemaining: Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
    }));

    timerRef.current = setInterval(() => {
      setState((prev) => {
        const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
        if (remaining <= 0) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return { ...prev, timeRemaining: 0 };
        }
        return { ...prev, timeRemaining: remaining };
      });
    }, 250);
  }, [state.currentQuestionIndex, questions]);

  // Handle answer selection
  const selectAnswer = useCallback((answer: string | string[]) => {
    const currentQuestion = questions[state.currentQuestionIndex];
    if (!currentQuestion || state.isAnswered) return;

    setState((prev) => {
      const newSelectedAnswers = new Map(prev.selectedAnswers);
      const questionType = currentQuestion.question_type?.toLowerCase();
      const isMultipleChoice = questionType === "multiple_choice";

      if (isMultipleChoice && typeof answer === "string") {
        // Toggle logic for multiple choice
        const currentAnswers = Array.isArray(prev.selectedAnswers.get(currentQuestion.id))
          ? (prev.selectedAnswers.get(currentQuestion.id) as string[])
          : [];
        
        const newAnswers = currentAnswers.includes(answer)
          ? currentAnswers.filter(id => id !== answer)
          : [...currentAnswers, answer];
        
        newSelectedAnswers.set(currentQuestion.id, newAnswers);
      } else {
        // Normal replacement logic
        newSelectedAnswers.set(currentQuestion.id, answer);
      }

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

    const answerData: GameQuizAnswer = {
      questionId: currentQuestion.id,
      selectedOptionId: typeof selectedAnswer === "string" ? selectedAnswer : undefined,
      selectedOptionIds: Array.isArray(selectedAnswer) ? selectedAnswer : undefined,
      textAnswer: typeof selectedAnswer === "string" && 
        (currentQuestion.question_type === "fill_blank" || 
         currentQuestion.question_type === "essay" ||
         currentQuestion.question_type === "matching") 
        ? selectedAnswer : undefined,
      answeredAt: new Date(),
      timeSpent: (currentQuestion.time_limit || 0) - state.timeRemaining,
    };

    setState((prev) => ({
      ...prev,
      isAnswered: true,
    }));

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Callback
    onAnswerSubmit?.(answerData);
  }, [state, questions, onAnswerSubmit]);

  const applyAnswerResult = useCallback((questionId: string, isCorrect: boolean, points: number) => {
    if (scoredQuestionsRef.current.has(questionId)) return;
    scoredQuestionsRef.current.add(questionId);
    setState((prev) => ({
      ...prev,
      score: prev.score + Number(points || 0),
      correctAnswersCount: prev.correctAnswersCount + (isCorrect ? 1 : 0),
    }));
  }, []);

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
  }, [state.currentQuestionIndex, state.isAnswered, state.isGameStarted, startTimerForCurrentQuestion]);

  useEffect(() => {
    if (state.isGameEnded && !endNotifiedRef.current) {
      endNotifiedRef.current = true;
      onGameEnd?.(state.score);
    }
  }, [onGameEnd, state.isGameEnded, state.score]);

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
    correctAnswersCount: state.correctAnswersCount,
    totalScore: state.totalScore,
    timeRemaining: state.timeRemaining,
    hasSelectedAnswer: !!selectedAnswer && (!Array.isArray(selectedAnswer) || selectedAnswer.length > 0),
    isLastQuestion: state.currentQuestionIndex >= questions.length - 1,
    selectedAnswers: state.selectedAnswers,
    syncGameState,
    syncScore,
    // Actions
    selectAnswer,
    submitAnswer,
    applyAnswerResult,
  };
};


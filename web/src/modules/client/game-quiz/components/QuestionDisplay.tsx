"use client";

import React from "react";
import { Question } from "../../do-quiz/types/quiz.types";
import { QuestionRendererFactory } from "../factory/QuestionRendererFactory";
import { QuestionRendererProps } from "../types/game-quiz.types";

interface QuestionDisplayProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  selectedAnswer?: string | string[];
  onAnswerSelect: (answer: string | string[]) => void;
  isAnswered: boolean;
  timeRemaining?: number;
}

export const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  isAnswered,
  timeRemaining,
}) => {
  const strategy = QuestionRendererFactory.getStrategyForQuestion(question);

  const renderProps: QuestionRendererProps = {
    question,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    onAnswerSelect,
    isAnswered,
    timeRemaining,
  };

  return <>{strategy.render(renderProps)}</>;
};


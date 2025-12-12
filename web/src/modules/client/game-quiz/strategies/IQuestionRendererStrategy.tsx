"use client";

import React from "react";
import { Question } from "../../do-quiz/types/quiz.types";
import { QuestionRendererProps } from "../types/game-quiz.types";

export interface IQuestionRendererStrategy {
  render(props: QuestionRendererProps): React.ReactNode;
  validateAnswer(question: Question, answer: string | string[]): boolean;
  getDefaultAnswer(): string | string[];
}

